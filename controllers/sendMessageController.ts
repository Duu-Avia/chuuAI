import { Request, Response } from "express";
import PageSettings from "../models/PageSettings";
import { decrypt } from "../utils/encryption";

export async function sendMessage(req: Request, res: Response) {
  try {
    const { pageId, recipientId, text } = req.body;
    if (!pageId || !recipientId || !text) {
      return res.status(400).json({ error: "Missing pageId, recipientId, or text" });
    }

    const page = await PageSettings.findOne({ pageId });
    if (!page?.accessToken) {
      return res.status(404).json({ error: "Page not found or missing token" });
    }

    const token = decrypt(page.accessToken);

    const fbRes = await fetch(
      `https://graph.facebook.com/v23.0/me/messages?access_token=${token}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messaging_type: "RESPONSE",
          recipient: { id: recipientId }, // PSID
          message: { text }
        })
      }
    );

    const data = await fbRes.json();
    if (!fbRes.ok) return res.status(400).json({ error: "Facebook send failed", details: data });
    return res.json({ ok: true, data });
  } catch (e) {
    console.error("sendMessage error:", e);
    return res.status(500).json({ error: "Internal server error" });
  }
}
