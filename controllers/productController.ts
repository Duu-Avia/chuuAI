// controllers/productController.ts
import { Request, Response } from "express";
import Product from "../models/Products";

// GET /products?pageId=...
export async function listProducts(req: Request, res: Response) {
  const { pageId } = req.query as { pageId?: string };
  if (!pageId) return res.status(400).json({ error: "pageId is required" });
  const items = await Product.find({ pageId }).sort({ createdAt: -1 }).lean();
  return res.json(items);
}

// POST /products?pageId=...
export async function createProduct(req: Request, res: Response) {
  const { pageId } = req.query as { pageId?: string };
  if (!pageId) return res.status(400).json({ error: "pageId is required" });

  try {
    const payload = { ...req.body, pageId }; // force tenant
    const created = await Product.create(payload);
    return res.status(201).json(created);
  } catch (e: any) {
    if (e?.code === 11000) {
      return res.status(409).json({ error: "SKU already exists for this page" });
    }
    return res.status(500).json({ error: "Create failed" });
  }
}

// PUT /products/:id?pageId=...
export async function updateProduct(req: Request, res: Response) {
  const { pageId } = req.query as { pageId?: string };
  const { id } = req.params;
  if (!pageId) return res.status(400).json({ error: "pageId is required" });

  const updated = await Product.findOneAndUpdate(
    { _id: id, pageId },
    { ...req.body, pageId }, // force tenant
    { new: true }
  );
  if (!updated) return res.status(404).json({ error: "Not found" });
  return res.json(updated);
}

// DELETE /products/:id?pageId=...
export async function deleteProduct(req: Request, res: Response) {
  const { pageId } = req.query as { pageId?: string };
  const { id } = req.params;
  if (!pageId) return res.status(400).json({ error: "pageId is required" });

  const deleted = await Product.findOneAndDelete({ _id: id, pageId });
  if (!deleted) return res.status(404).json({ error: "Not found" });
  return res.json({ ok: true });
}

// POST /products/:id/stock?pageId=... { delta: number }
export async function adjustStock(req: Request, res: Response) {
  const { pageId } = req.query as { pageId?: string };
  const { id } = req.params;
  const { delta } = req.body as { delta?: number };
  if (!pageId) return res.status(400).json({ error: "pageId is required" });
  if (typeof delta !== "number") return res.status(400).json({ error: "delta must be a number" });

  // clamp to >= 0
  const current = await Product.findOne({ _id: id, pageId });
  if (!current) return res.status(404).json({ error: "Not found" });

  const next = Math.max(0, (current.stock || 0) + delta);
  current.stock = next;
  await current.save();

  return res.json(current);
}
