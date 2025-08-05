require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
import { handleWebhook } from './controllers/webhookController';
import { Request, Response } from 'express';
import cors from 'cors';
import { connectPage } from './controllers/connectPageController';

const app = express();
const allowOrigins = ['https://chuuai-frontend.vercel.app','https://www.chuuai.mn'];
app.use(cors({
  origin: allowOrigins, 
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true,}))
app.use(express.json());

// MongoDB Connect
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err:string) => console.error('MongoDB error:', err));


app.get('/webhook', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
    console.log('✅ Webhook verified');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

app.post('/webhook', (req: Request, res: Response, next: import('express').NextFunction) => {
  console.log('🚨 /webhook POST hit!');
  next(); // call next handler (handleWebhook)
});


// Webhook Handler
app.post('/webhook', handleWebhook);

app.post('/api/connect-page', connectPage);

app.get('/privacy-policy', (req:Request, res:Response) => {
  res.send(`
    <h1>Privacy Policy</h1>
    <p>We respect your privacy. ChuuAI does not collect personal data. Messages are only used to generate AI responses and are not shared.</p>
  `);
});

app.get('/terms', (req:Request, res:Response) => {
  res.send(`
    <h1>Terms of Service</h1>
    <p>By using ChuuAI, you agree to receive automated replies. We are not liable for generated content. Use at your own discretion.</p>
  `);
});

app.get('/delete-data', (req:Request, res:Response) => {
  res.send(`
    <h1>Data Deletion Instructions</h1>
    <p>If you wish to delete your data, please email us at duuavia01@gmail.com with your Facebook Page ID.</p>
  `);
});


// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
