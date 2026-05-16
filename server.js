const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || '');
const path = require('path');
const fs = require('fs');
const app = express();

app.use(express.static(path.join(__dirname)));
app.use(express.json());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/create-checkout-session', async (req, res) => {
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: 'AI Broker System',
                        description: 'Institutional-grade trading automation',
                    },
                    unit_amount: 150000,
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: `${req.headers.origin}/success.html`,
            cancel_url: `${req.headers.origin}/`,
        });
        res.json({ id: session.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET || '');
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        console.log(`PAYMENT: ${session.customer_details.email}`);
        const line = `${new Date().toISOString()},${session.customer_details.email},${session.id},PAID\n`;
        fs.appendFileSync('/tmp/payments.csv', line);
    }
    res.json({ received: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Scalon AI running on port ${PORT}`));
