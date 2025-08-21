import { Request, Response } from "express";
import PageSettings from "../models/PageSettings";
import { getReply } from "../services/aiService";
import Message from "../models/Message";
import { decrypt } from "../utils/encryption";

export async function handleWebhook(req: Request, res: Response) {
  try {
    const body = req.body;

    console.log("📥 Webhook received:", JSON.stringify(body, null, 2));

    if (body.object !== "page") {
      console.log("❌ Not a page event:", body.object);
      return res.sendStatus(404);
    }

    for (const entry of body.entry ?? []) {
      const pageId = entry.id;
      console.log("📄 Page ID:", pageId);

      const events: any[] = entry.messaging ?? [];
      for (const evt of events) {
        const senderId: string | undefined = evt?.sender?.id;
        if (!senderId) continue;

        // Extract a definite string to pass to getReply()
        const text: string | null =
          (typeof evt?.message?.text === "string" && evt.message.text) ||
          (typeof evt?.postback?.payload === "string" && evt.postback.payload) ||
          (typeof evt?.message?.quick_reply?.payload === "string" && evt.message.quick_reply.payload) ||
          null;

        // If there are attachments, you can tag them as a placeholder
        const hasAttachment =
          Array.isArray(evt?.message?.attachments) && evt.message.attachments.length > 0;

        const normalizedText: string | null = text ?? (hasAttachment ? "[attachment]" : null);

        // Nothing we can turn into a reply → skip
        if (!normalizedText) continue;

        console.log("✉️ Incoming message");
        console.log("👤 Sender ID:", senderId);
        console.log("💬 Message Text:", normalizedText);

        // Save inbound message (best-effort)
        try {
          await Message.create({
            pageId,
            senderId,
            message: normalizedText,
            timestamp: Date.now(),
          });
        } catch (e) {
          console.error("⚠️ Message.create failed:", e);
        }

        const page = await PageSettings.findOne({ pageId });
        if (!page || !page.accessToken) {
          console.error(`⚠️ No PageSettings/accessToken found for pageId: ${pageId}`);
          continue;
        }

        const decryptedToken = decrypt(page.accessToken);

        let reply = "Sorry, I couldn't process that right now.";
        try {
          // ✅ TypeScript-safe: normalizedText is a definite string here
          reply = await getReply(normalizedText, pageId);
        } catch (e) {
          console.error("⚠️ getReply error:", e);
        }

        console.log("🤖 Generated Reply:", reply);

        try {
          const fbRes = await fetch(
            `https://graph.facebook.com/v19.0/me/messages?access_token=${decryptedToken}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                recipient: { id: senderId },
                message: { text: reply },
              }),
            }
          );

          let fbJson: any = {};
          try {
            fbJson = await fbRes.json();
          } catch {
            // some responses may not have a body
          }

          if (!fbRes.ok) {
            console.error("❌ Facebook send error:", fbJson);
          } else {
            console.log("📬 Facebook Response:", fbJson);
          }
        } catch (e) {
          console.error("❌ Facebook fetch error:", e);
        }
      }
    }

    // Always ACK to stop Meta retries
    return res.status(200).send("EVENT_RECEIVED");
  } catch (err) {
    console.error("❌ Webhook error:", err);
    return res.sendStatus(500);
  }
}
