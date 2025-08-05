"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const webhookController_1 = require("./controllers/webhookController");
const cors_1 = __importDefault(require("cors"));
const connectPageController_1 = require("./controllers/connectPageController");
const app = express();
const allowOrigins = ['https://chuuai-frontend.vercel.app', 'https://www.chuuai.mn'];
app.use((0, cors_1.default)({
    origin: allowOrigins,
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true,
}));
app.use(express.json());
// MongoDB Connect
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB connected'))
    .catch((err) => console.error('MongoDB error:', err));
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
        console.log('✅ Webhook verified');
        res.status(200).send(challenge);
    }
    else {
        res.sendStatus(403);
    }
});
app.post('/webhook', (req, res, next) => {
    console.log('🚨 /webhook POST hit!');
    next(); // call next handler (handleWebhook)
});
// Webhook Handler
app.post('/webhook', webhookController_1.handleWebhook);
app.post('/api/connect-page', connectPageController_1.connectPage);
app.get('/privacy-policy', (req, res) => {
    res.send(`
    <h1>Privacy Policy</h1>
    <p>We respect your privacy. ChuuAI does not collect personal data. Messages are only used to generate AI responses and are not shared.</p>
  `);
});
app.get('/terms', (req, res) => {
    res.send(`
    <h1>Terms of Service</h1>
    <p>By using ChuuAI, you agree to receive automated replies. We are not liable for generated content. Use at your own discretion.</p>
  `);
});
app.get('/delete-data', (req, res) => {
    res.send(`
    <h1>Data Deletion Instructions</h1>
    <p>If you wish to delete your data, please email us at duuavia01@gmail.com with your Facebook Page ID.</p>
  `);
});
// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
