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

    return res.status(200).json({ message: "✅ Page connected successfully" });
  } catch (error) {
    console.error("❌ connectPage error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
