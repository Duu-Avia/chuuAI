import { Request, Response } from "express";
import PageSettings from "../models/PageSettings";
import { encrypt } from "../utils/encryption";
 // 🔒 Import the encryption function

export async function connectPage(req: Request, res: Response) {
  try {
    const { pageId, accessToken, pageName } = req.body;

    if (!pageId || !accessToken || !pageName) {
      return res.status(400).json({ error: "Missing required fields" });
    }

const encryptedToken = encrypt(accessToken); // 🔐 Encrypt once

console.log("🧪 Received raw token:", accessToken);
console.log("🔐 Encrypted token (preview):", encryptedToken.slice(0, 30)); // Use the same one



    const savedPage = await PageSettings.findOneAndUpdate(
      { pageId },
      {
        pageId,
        accessToken: encryptedToken, // 🔐 Save encrypted
        name: pageName,
      },
      { upsert: true, new: true }
    );

    console.log("✅ Page connected:", savedPage.name);

    // Use raw token (not encrypted one) to subscribe to webhook
    const response = await fetch(
      `https://graph.facebook.com/v19.0/${pageId}/subscribed_apps?subscribed_fields=messages,messaging_postbacks&access_token=${accessToken}`,
      { method: "POST" }
    );

    const result = await response.json();

    if (response.ok) {
      await PageSettings.updateOne({ pageId }, { webhookSubscribed: true });
    } else {
      console.error("❌ Webhook subscription failed:", result);
      await PageSettings.updateOne({ pageId }, { webhookSubscribed: false });
    }

    return res.status(200).json({ message: "✅ Page connected" });
  } catch (error) {
    console.error("❌ connectPage error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
