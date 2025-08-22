import { Router } from "express";
import { requirePageAccess } from "../middleware/requirePageAccess";
import { startOrRenewSubscription } from "../services/subscription";

const router = Router();

router.post("/renew", requirePageAccess, async (req, res) => {
  try {
    const pageId = (req as any).pageId as string;
    const endsAt = await startOrRenewSubscription(pageId, 1);
    res.json({ ok: true, subscriptionEndsAt: endsAt.toISOString() });
  } catch (e: any) {
    res.status(500).json({ error: e.message || "Renew failed" });
  }
});

export default router;
