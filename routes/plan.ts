// routes/plan.ts
import { Router } from "express";
import PageSettings from "../models/PageSettings";
import Usage from "../models/Usage";
import { getCaps, type Plan } from "../services/planCaps";
import { monthKey } from "../services/usage";
import { requirePageAccess } from "../middleware/requirePageAccess";

const router = Router();

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

router.get("/", requirePageAccess, async (req, res) => {
  const pageId = (req as any).pageId as string;

  const page = await PageSettings.findOne({ pageId }).lean();
  if (!page) return res.status(404).json({ error: "Not found" });

  const plan = (page.plan ?? "starter") as Plan;
  const caps = getCaps(plan, normalizeOverrides((page as any).overrides));

  const usage = await Usage.findOne({ pageId, month: monthKey() }).lean();
  const messagesUsed = usage?.messages ?? 0;

  const limit =
    caps.quotas.messagesPerMonth === "unlimited"
      ? Infinity
      : Number(caps.quotas.messagesPerMonth ?? 0);

  const limitExceeded = Number.isFinite(limit) && messagesUsed >= limit;

  // ---- compute subscription status once
  const rawEnds = (page as any).subscriptionEndsAt ?? null;
  const endsAt = rawEnds ? new Date(rawEnds) : null;
  const now = new Date();
  const subscriptionActive = !endsAt || endsAt > now;

  // 🔎 debug
  console.log("[/api/plan]", {
    pageId,
    plan,
    rawEnds,
    endsAtISO: endsAt ? endsAt.toISOString() : null,
    nowISO: now.toISOString(),
    subscriptionActive,
    messagesUsed,
    limit,
    limitExceeded,
  });

  return res.json({
    plan,
    caps,
    usage: { month: monthKey(), messages: messagesUsed },
    subscriptionActive,
    subscriptionEndsAt: endsAt ? endsAt.toISOString() : null,
    limitExceeded,
  });
});

export default router;
