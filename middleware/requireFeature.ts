// middleware/requireFeature.ts (or usage.ts if that's the file name)
import { Request, Response, NextFunction } from "express";
import PageSettings from "../models/PageSettings";
import { getCaps, type Plan } from "../services/planCaps";

export function requireFeature(feature: keyof ReturnType<typeof getCaps>["features"]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const pageId = (req as any).pageId as string;
    if (!pageId) return res.status(400).json({ error: "Missing pageId" });

    const page = await PageSettings.findOne({ pageId }).lean();
    if (!page) return res.status(404).json({ error: "Page not found" });

    // Normalize plan & overrides safely
    const plan = (page.plan ?? "starter") as Plan;

    const overrides =
      page.overrides
        ? {
            // accept either messagesPerMonth OR legacy messagePerMonth
            messagesPerMonth:
              (page as any).overrides.messagesPerMonth ??
              (page as any).overrides.messagePerMonth ??
              undefined,
            extraInstagramPages:
              (page as any).overrides.extraInstagramPages ?? undefined,
          }
        : undefined;

    const caps = getCaps(plan, overrides);

    if (!caps.features[feature]) {
      return res.status(403).json({ error: `Your plan doesn't include ${feature}` });
    }
    return next();
  };
}
