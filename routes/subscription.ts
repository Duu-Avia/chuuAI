// routes/subscription.ts
import { Router } from "express";
import { z } from "zod";
import { requirePageAccess } from "../middleware/requirePageAccess";
import PageSettings from "../models/PageSettings";

const PlanSchema = z.enum(["starter", "pro", "enterprise"]);

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

/**
 * Activate (or change) plan and start 1-month subscription window.
 * POST /api/subscription/activate?pageId=... { plan: "starter" | "pro" | "enterprise" }
 */
router.post("/activate", requirePageAccess, async (req, res) => {
  const pageId = (req as any).pageId as string;

  const parsed = PlanSchema.safeParse(req.body?.plan);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid plan. Use 'starter' | 'pro' | 'enterprise'." });
  }
  const plan = parsed.data;

  const page = await PageSettings.findOne({ pageId });
  if (!page) return res.status(404).json({ error: "Page not found" });

  const now = new Date();
  const base = page.subscriptionEndsAt && page.subscriptionEndsAt > now ? page.subscriptionEndsAt : now;

  page.plan = plan; // <-- persist the chosen plan
  page.subscriptionEndsAt = addMonthsClamped(base, 1);
  await page.save();

  console.log("[/api/subscription/activate] saved", {
    pageId,
    plan: page.plan,
    subscriptionEndsAt: page.subscriptionEndsAt?.toISOString(),
  });

  return res.json({
    ok: true,
    plan: page.plan,
    subscriptionEndsAt: page.subscriptionEndsAt?.toISOString() ?? null,
  });
});

/**
 * Optional: renew 1 month without changing plan.
 * POST /api/subscription/renew?pageId=...
 */
router.post("/renew", requirePageAccess, async (req, res) => {
  const pageId = (req as any).pageId as string;
  const page = await PageSettings.findOne({ pageId });
  if (!page) return res.status(404).json({ error: "Page not found" });

  const base = page.subscriptionEndsAt && page.subscriptionEndsAt > new Date()
    ? page.subscriptionEndsAt
    : new Date();

  page.subscriptionEndsAt = addMonthsClamped(base, 1);
  await page.save();

  return res.json({
    ok: true,
    plan: page.plan,
    subscriptionEndsAt: page.subscriptionEndsAt.toISOString(),
  });
});

export default router;
