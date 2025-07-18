const Message = require('../models/Message');
import { getReply } from '../services/aiService';

import { Request, Response } from 'express';

async function handleWebhook(req: Request, res: Response) {
  if (req.body.object === 'page') {
    for (const entry of req.body.entry) {
      const pageId = entry.id;
      for (const event of entry.messaging) {
        const senderId = event.sender.id;
        const text = event.message?.text;

        if (text) {
          await Message.create({
            pageId,
            senderId,
            message: text,
            timestamp: event.timestamp
          });

          const reply = await getReply(text);

          await fetch(`https://graph.facebook.com/v19.0/me/messages?access_token=${process.env.PAGE_ACCESS_TOKEN}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              recipient: { id: senderId },
              message: { text: reply }
            })
          });
        }
      }
    }
    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
}

module.exports = { handleWebhook };
