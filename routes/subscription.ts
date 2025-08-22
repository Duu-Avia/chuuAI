// routes/subscription.ts
import { Router } from "express";
import { requirePageAccess } from "../middleware/requirePageAccess";
import PageSettings from "../models/PageSettings";

function addMonthsClamped(date: Date, months: number) {
  const d = new Date(date);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, lastDay));
  return d;
}

const router = Router();

router.post("/renew", requirePageAccess, async (req, res) => {
  const pageId = (req as any).pageId as string;
  const page = await PageSettings.findOne({ pageId });
  if (!page) return res.status(404).json({ error: "Page not found" });

  const base = page.subscriptionEndsAt && page.subscriptionEndsAt > new Date()
    ? page.subscriptionEndsAt
    : new Date();

  page.subscriptionEndsAt = addMonthsClamped(base, 1);
  await page.save();

  res.json({ ok: true, subscriptionEndsAt: page.subscriptionEndsAt.toISOString() });
});

export default router;
