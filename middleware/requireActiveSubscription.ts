import { Request, Response, NextFunction } from "express";
import PageSettings from "../models/PageSettings";

export async function requireActiveSubscription(req: Request, res: Response, next: NextFunction) {
  const pageId = (req as any).pageId as string;
  if (!pageId) return res.status(400).json({ error: "Missing pageId" });

  const page = await PageSettings.findOne({ pageId }).lean();
  if (!page) return res.status(404).json({ error: "Page not found" });

  const ends = page.subscriptionEndsAt ? new Date(page.subscriptionEndsAt) : null;
  const active = !ends || ends > new Date();
  if (!active) {
    return res.status(402).json({ error: "expired", message: "Таны багцын хугацаа дууссан байна" });
  }
  return next();
}
