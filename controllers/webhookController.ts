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

      // ✅ Save user message to DB
      await Message.create({
        pageId,
        senderId,
        message: messageText,
        timestamp: Date.now(),
      });

      // 🔄 Fetch page settings (accessToken + systemPrompt etc)
      const page = await PageSettings.findOne({ pageId });
      if (!page || !page.accessToken) {
        console.error(`⚠️ No PageSettings found for pageId: ${pageId}`);
        continue;
      }

      // 💬 Generate AI reply based on that page
      const reply = await getReply(messageText, pageId);

      // 📤 Send the reply back to the user via Messenger API
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
