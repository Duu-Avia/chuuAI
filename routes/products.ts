// routes/products.ts
import { Router, Request, Response } from "express";
import { z } from "zod";
import { requirePageAccess } from "../middleware/requirePageAccess";
import mongoose, { Types } from "mongoose";

import Products from "../models/Products";

const router = Router();

// ---- Validation ----
const ImagesSchema = z
  .union([z.array(z.string()), z.string()])
  .optional()
  .transform((val) => {
    if (!val) return [];
    return Array.isArray(val) ? val : [val];
  });

const createSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.coerce.number().min(0),
  stock: z.coerce.number().int().min(0).default(0),
  currency: z.string().default("MNT"),
  status: z.enum(["active", "hidden"]).optional(),
  images: ImagesSchema,
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  price: z.coerce.number().min(0).optional(),
  stock: z.coerce.number().int().min(0).optional(),
  currency: z.string().optional(),
  status: z.enum(["active", "hidden"]).optional(),
  images: ImagesSchema,
});

const adjustSchema = z.object({ delta: z.coerce.number().int() });

// ---- Create ----
router.post("/", requirePageAccess, async (req: Request, res: Response) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  try {
    const pageId = (req as any).pageId as string; // set by requirePageAccess
    const payload = { ...parsed.data, pageId };   // force tenant
    const doc = await Products.create(payload);
    res.status(201).json(doc);
  } catch (e: any) {
    if (e?.code === 11000) {
      return res.status(409).json({ error: "SKU already exists for this page" });
    }
    console.error("Create failed:", e);
    res.status(500).json({ error: "Create failed" });
  }
});

// ---- List (search + cursor) ----
router.get("/", requirePageAccess, async (req: Request, res: Response) => {
  const pageId = (req as any).pageId as string;
  const q = (req.query.q as string) || "";
  const limit = Math.min(parseInt((req.query.limit as string) || "20", 10), 100);
  const cursor = req.query.cursor as string | undefined;

  const filter: any = { pageId };
  if (q) filter.$or = [{ name: { $regex: q, $options: "i" } }, { sku: { $regex: q, $options: "i" } }];

if (cursor && Types.ObjectId.isValid(String(cursor))) {
  // push cursor constraint into the filter itself
  (filter as any)._id = { $lt: new Types.ObjectId(String(cursor)) };
}
const base = Products.find(filter).sort({ _id: -1 }).limit(limit + 1);


  const items = await base.exec();
  const hasMore = items.length > limit;
  const pageItems = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore ? String(items[limit]._id) : null; // use the extra doc as cursor

  res.json({ items: pageItems, nextCursor });
});

// ---- Get one ----
router.get("/:id", requirePageAccess, async (req: Request, res: Response) => {
  const pageId = (req as any).pageId as string;
  const item = await Products.findOne({ _id: req.params.id, pageId });
  if (!item) return res.status(404).json({ error: "Not found" });
  res.json(item);
});

// ---- Edit ----
router.patch("/:id", requirePageAccess, async (req: Request, res: Response) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const pageId = (req as any).pageId as string;
  const updated = await Products.findOneAndUpdate(
    { _id: req.params.id, pageId },
    { $set: parsed.data },
    { new: true }
  );
  if (!updated) return res.status(404).json({ error: "Not found" });
  res.json(updated);
});

// ---- Add / minus stock atomically (never below 0) ----
router.post("/:id/stock", requirePageAccess, async (req: Request, res: Response) => {
  const parsed = adjustSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { delta } = parsed.data;

  const pageId = (req as any).pageId as string;

  const updated = await Products.findOneAndUpdate(
    { _id: req.params.id, pageId, $expr: { $gte: [{ $add: ["$stock", delta] }, 0] } },
    { $inc: { stock: delta } },
    { new: true }
  );
  if (!updated) return res.status(400).json({ error: "Insufficient stock or product not found" });
  res.json(updated);
});

// ---- Delete ----
router.delete("/:id", requirePageAccess, async (req: Request, res: Response) => {
  const pageId = (req as any).pageId as string;
  const removed = await Products.findOneAndDelete({ _id: req.params.id, pageId });
  if (!removed) return res.status(404).json({ error: "Not found" });
  res.json({ ok: true });
});

export default router;
