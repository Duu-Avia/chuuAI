// routes/plan.ts
import { Router } from "express";
import PageSettings from "../models/PageSettings";
import Usage from "../models/Usage";
import { getCaps, type Plan } from "../services/planCaps"; // <- case sensitive
import { monthKey } from "../services/usage";
import { requirePageAccess } from "../middleware/requirePageAccess";

const router = Router();

// helper to coerce nullables into the shape getCaps expects
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

  res.json({
    plan: page.plan,
    caps,
    usage: { month: monthKey(), messages: usage?.messages || 0 },
  });
});

export default router;
