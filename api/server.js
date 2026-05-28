const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || '');
const path = require('path');
const app = express();

app.use(express.json());

app.post('/create-checkout-session', async (req, res) => {
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: 'Scalon AI — Full AI Broker System',
                        description: 'Complete AI broker license + onboarding + scripts',
                    },
                    unit_amount: 99700,
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: `${req.headers.origin || 'https://scalon-sales.vercel.app'}/success`,
            cancel_url: `${req.headers.origin || 'https://scalon-sales.vercel.app'}/`,
        });
        res.json({ url: session.url });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.webhook = async (req, res) => {
    // webhook handling...
    res.json({ received: true });
};

// Export for Vercel serverless
module.exports = app;
