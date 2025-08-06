import { Request, Response } from 'express';
import PageSettings from '../models/PageSettings';
import { getReply } from '../services/aiService';
import Message from '../models/Message';
import { decrypt } from '../utils/encryption'; // 🛡 Import decrypt helper

export async function handleWebhook(req: Request, res: Response) {
  try {
    const body = req.body;

    console.log('📥 Webhook received:', JSON.stringify(body, null, 2));

    if (body.object !== 'page') {
      console.log('❌ Not a page event:', body.object);
      return res.sendStatus(404);
    }

    for (const entry of body.entry) {
      const pageId = entry.id;
      console.log('📄 Page ID:', pageId);

      //  Handle normal messages
      const messagingEvent = entry.messaging?.[0];
      if (messagingEvent?.message?.text) {
        const senderId = messagingEvent.sender.id;
        const messageText = messagingEvent.message.text;

        console.log('✉️ Incoming message');
        console.log('👤 Sender ID:', senderId);
        console.log('💬 Message Text:', messageText);

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

        const decryptedToken = decrypt(page.accessToken); // 🔓 Decrypt access token

        const reply = await getReply(messageText, pageId);
        console.log('🤖 Generated Reply:', reply);

        const fbRes = await fetch(`https://graph.facebook.com/v19.0/me/messages?access_token=${decryptedToken}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            recipient: { id: senderId },
            message: { text: reply }
          })
        });

        const fbJson = await fbRes.json();
        console.log('📬 Facebook Response:', fbJson);
      }
    }

    res.status(200).send('EVENT_RECEIVED');
  } catch (err) {
    console.error('❌ Webhook error:', err);
    res.sendStatus(500);
  }
}
