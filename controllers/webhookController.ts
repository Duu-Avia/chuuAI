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
      const pageId = entry.id;

      // ✅ Handle normal messages
      const messagingEvent = entry.messaging?.[0];
      if (messagingEvent?.message?.text) {
        const senderId = messagingEvent.sender.id;
        const messageText = messagingEvent.message.text;

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

      // ✅ Handle comment replies (from feed changes)
      if (entry.changes) {
        for (const change of entry.changes) {
          const value = change.value;

          if (change.field === 'feed' && value.item === 'comment') {
            const commentMessage = value.message;
            const commenterId = value.from?.id;
            const commentId = value.comment_id;

            console.log('📝 New comment:', commentMessage);

            const triggerWords = ['medeelel', 'une', 'awii', 'info'];
            const isInterested = triggerWords.some(word =>
              commentMessage?.toLowerCase().includes(word)
            );

            if (!isInterested || !commentMessage || !commenterId) continue;

            const page = await PageSettings.findOne({ pageId });
            if (!page || !page.accessToken) {
              console.warn(`⚠️ Page not found or missing token: ${pageId}`);
              continue;
            }

            const reply = await getReply(commentMessage, pageId);

            // ✅ Use fetch for private reply to comment
            await fetch(`https://graph.facebook.com/v19.0/${commentId}/private_replies?access_token=${page.accessToken}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                message: reply
              })
            });

            console.log(`📩 Auto-DM sent to commenter: ${commenterId}`);
          }
        }
      }
    }

    res.status(200).send('EVENT_RECEIVED');
  } catch (err) {
    console.error('❌ Webhook error:', err);
    res.sendStatus(500);
  }
}
