import { Request, Response } from 'express';
import PageSettings from '../models/PageSettings';
import { getReply } from '../services/aiService';
import Message from '../models/Message';

export async function handleWebhook(req: Request, res: Response) {
  try {
    const body = req.body;

    if (body.object !== 'page') {
      return res.sendStatus(404);
    }

    for (const entry of body.entry) {
      const webhookEvent = entry.messaging?.[0];
      if (!webhookEvent || !webhookEvent.message?.text) continue;

      const senderId = webhookEvent.sender.id;
      const pageId = entry.id;
      const messageText = webhookEvent.message.text;

      await Message.create({
        pageId,
        senderId,
        message: messageText,
        timestamp: Date.now(),
      });

      const page = await PageSettings.findOne({ pageId });
      if (!page || !page.accessToken) {
        console.error(`⚠️ No PageSettings found for pageId: ${pageId}`);
        continue;
      }

      const reply = await getReply(messageText, pageId);

      await fetch(`https://graph.facebook.com/v19.0/me/messages?access_token=${page.accessToken}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipient: { id: senderId },
          message: { text: reply }
        })
      });
    }

    res.status(200).send('EVENT_RECEIVED');
  } catch (err) {
    console.error('❌ Webhook error:', err);
    res.sendStatus(500);
  }
}
