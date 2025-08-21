import { getAuth } from "@clerk/express";
import PageSettings from "../models/PageSettings";

export async function requirePageAccess(req: any, res: any, next: any) {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const pageId = String(req.query.pageId || "");
  if (!pageId) return res.status(400).json({ error: "pageId is required" });

  const page = await PageSettings.findOne({ pageId, ownerUserId: userId }).lean();
  if (!page) return res.status(403).json({ error: "No access to this pageId" });

  req.pageId = pageId;
  next();
}
