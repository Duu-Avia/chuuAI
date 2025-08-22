// controllers/webhookController.ts
import { Request, Response } from "express";
import PageSettings from "../models/PageSettings";
import { getReply } from "../services/aiService";
import Message from "../models/Message";
import { decrypt } from "../utils/encryption";
import { getCaps, type Plan } from "../services/planCaps";        // ⬅️ NEW
import { tryConsumeMessage } from "../services/usage";             // ⬅️ NEW

// normalize overrides so getCaps gets clean numbers (no nulls)
function normalizeOverrides(
  o: { messagesPerMonth?: number | null; extraInstagramPages?: number | null } | null | undefined
):
  | { messagesPerMonth?: number; extraInstagramPages?: number }
  | undefined {
  if (!o) return undefined;
  return {
    messagesPerMonth: o.messagesPerMonth ?? undefined,
    extraInstagramPages: o.extraInstagramPages ?? undefined,
  };
}

export async function handleWebhook(req: Request, res: Response) {
  try {
    const body = req.body;

    console.log("📥 Webhook received:", JSON.stringify(body, null, 2));

    if (body.object !== "page") {
      console.log("❌ Not a page event:", body.object);
      return res.sendStatus(404);
    }

    for (const entry of body.entry ?? []) {
      const pageId = entry.id as string;
      console.log("📄 Page ID:", pageId);

      const events: any[] = entry.messaging ?? [];
      for (const evt of events) {
        const senderId: string | undefined = evt?.sender?.id;
        if (!senderId) continue;

        // Extract the incoming text (or mark as attachment)
        const text: string | null =
          (typeof evt?.message?.text === "string" && evt.message.text) ||
          (typeof evt?.postback?.payload === "string" && evt.postback.payload) ||
          (typeof evt?.message?.quick_reply?.payload === "string" && evt.message.quick_reply.payload) ||
          null;

        const hasAttachment =
          Array.isArray(evt?.message?.attachments) && evt.message.attachments.length > 0;

        const normalizedText: string | null = text ?? (hasAttachment ? "[attachment]" : null);
        if (!normalizedText) continue;

        console.log("✉️ Incoming message");
        console.log("👤 Sender ID:", senderId);
        console.log("💬 Message Text:", normalizedText);

        // Best-effort: save inbound message
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

        // Load page settings + token
        const page = await PageSettings.findOne({ pageId }).lean();
        if (!page || !page.accessToken) {
          console.error(`⚠️ No PageSettings/accessToken found for pageId: ${pageId}`);
          continue;
        }
        const decryptedToken = decrypt(page.accessToken);

        // ---- PLAN CAPS + MONTHLY MESSAGE LIMIT (NEW) ----
        const plan = (page.plan ?? "starter") as Plan;
        const caps = getCaps(plan, normalizeOverrides((page as any).overrides));

        // If AI replies are disabled for this plan, just skip replying
        if (!caps.features.aiReply) {
          console.log("⛔ aiReply feature disabled for this plan, skipping reply.");
          continue;
        }

        // Enforce monthly message quota BEFORE calling AI
        const { allowed, current } = await tryConsumeMessage(
          pageId,
          caps.quotas.messagesPerMonth
        );

        if (!allowed) {
          console.log(`⛔ Monthly message limit reached. Current: ${current}`);
          // Optionally notify the end user politely
          try {
            const fbRes = await fetch(
              `https://graph.facebook.com/v19.0/me/messages?access_token=${decryptedToken}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  recipient: { id: senderId },
                  message: {
                    text:
                      "📈 Сарын мессежийн хязгаарт хүрлээ. Илүү их мессеж ашиглахын тулд багцаа шинэчилнэ үү.",
                  },
                }),
              }
            );
            // Ignore body parsing errors
            try { await fbRes.json(); } catch {}
          } catch (e) {
            console.error("❌ Facebook send (limit reached) error:", e);
          }
          continue; // do not call AI
        }
        // ---- END PLAN/LIMIT LOGIC ----

        // Call AI safely
        let reply = "Уучлаарай, одоогоор боловсруулахад алдаа гарлаа.";
        try {
          reply = await getReply(normalizedText, pageId);
        } catch (e) {
          console.error("⚠️ getReply error:", e);
        }

        console.log("🤖 Generated Reply:", reply);

        // Send reply back to Facebook
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
            // Some responses may not have a JSON body
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
