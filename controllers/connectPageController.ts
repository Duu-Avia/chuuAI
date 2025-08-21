import { Request, Response } from "express";
import { getAuth } from "@clerk/express";
import PageSettings from "../models/PageSettings";
import { encrypt } from "../utils/encryption";

export async function connectPage(req: Request, res: Response) {
  try {
    // 1) Who is calling? (your CLIENT's Clerk user id)
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    // 2) Validate input
    const { pageId, accessToken, pageName } = req.body;
    if (!pageId || !accessToken || !pageName) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // 3) If page already exists and belongs to someone else -> block
    const existing = await PageSettings.findOne({ pageId }).lean();
    if (existing && existing.ownerUserId && existing.ownerUserId !== userId) {
      return res.status(403).json({ error: "This page is already connected by another account." });
    }

    // 4) Save encrypted token + owner
    const encryptedToken = encrypt(accessToken);
    const savedPage = await PageSettings.findOneAndUpdate(
      { pageId },
      { pageId, name: pageName, accessToken: encryptedToken, ownerUserId: userId },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log("✅ Page connected:", savedPage.name, "by", userId);

    // 5) Subscribe webhook with RAW token
    const fbRes = await fetch(
      `https://graph.facebook.com/v19.0/${pageId}/subscribed_apps?subscribed_fields=messages,messaging_postbacks&access_token=${accessToken}`,
      { method: "POST" }
    );
    const fbJson = await fbRes.json().catch(() => ({}));

    await PageSettings.updateOne({ pageId }, { webhookSubscribed: fbRes.ok });

    return res.status(200).json({
      ok: true,
      pageId: savedPage.pageId,
      name: savedPage.name,
      webhookSubscribed: fbRes.ok,
      fb: fbRes.ok ? undefined : fbJson, // include FB error if any
    });
  } catch (error) {
    console.error("❌ connectPage error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
