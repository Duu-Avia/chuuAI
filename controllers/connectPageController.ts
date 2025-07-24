import { Request, Response } from "express";
import PageSettings from "../models/PageSettings";

export async function connectPage(req: Request, res: Response) {
  try {
    const { pageId, accessToken, pageName } = req.body;

    console.log("📥 Received connect-page request:", {
      pageId,
      accessToken,
      pageName,
    });

    if (!pageId || !accessToken || !pageName) {
      console.warn("⚠️ Missing required fields");
      return res.status(400).json({ error: "Missing required fields" });
    }

    const savedPage = await PageSettings.findOneAndUpdate(
      { pageId },
      {
        pageId,
        accessToken,
        name: pageName,
      },
      { upsert: true, new: true }
    );

    console.log("✅ Page saved or updated in DB:", savedPage);

    // ✅ Subscribe the page to webhook events
    const response = await fetch(`https://graph.facebook.com/v19.0/${pageId}/subscribed_apps?subscribed_fields=feed&access_token=${accessToken}`, {
      method: 'POST',
    });

    const result = await response.json();

    if (response.ok) {
      console.log("✅ Page successfully subscribed to webhook events");

      // ✅ Update flag in DB
      await PageSettings.updateOne({ pageId }, { webhookSubscribed: true });
    } else {
      console.error("❌ Failed to subscribe page to webhook:", result);

      // ✅ Optional: reset flag if failed
      await PageSettings.updateOne({ pageId }, { webhookSubscribed: false });
    }

    return res.status(200).json({ message: "✅ Page connected and subscription attempted" });
  } catch (error) {
    console.error("❌ connectPage error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
