// controllers/exchangeTokenController.ts
import { Request, Response } from "express";

export async function exchangeToken(req: Request, res: Response) {
  const { shortToken } = req.query;

  if (!shortToken) {
    return res.status(400).json({ error: "Missing shortToken" });
  }

  try {
    const appId = process.env.FACEBOOK_APP_ID;
    const appSecret = process.env.FACEBOOK_APP_SECRET;

    const exchangeUrl = `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortToken}`;

    const fbRes = await fetch(exchangeUrl);
    const data = await fbRes.json();

    if (!fbRes.ok) {
      console.error("❌ Token exchange failed:", data);
      return res.status(500).json({ error: "Token exchange failed" });
    }

    return res.json(data); // contains access_token
  } catch (err) {
    console.error("❌ Token exchange error:", err);
    return res.status(500).json({ error: "Internal error" });
  }
}
