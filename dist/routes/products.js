"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// routes/products.ts
const express_1 = require("express");
const zod_1 = require("zod");
const requirePageAccess_1 = require("../middleware/requirePageAccess");
const mongoose_1 = require("mongoose");
const Products_1 = __importDefault(require("../models/Products"));
const router = (0, express_1.Router)();
// ---- Validation ----
const ImagesSchema = zod_1.z
    .union([zod_1.z.array(zod_1.z.string()), zod_1.z.string()])
    .optional()
    .transform((val) => {
    if (!val)
        return [];
    return Array.isArray(val) ? val : [val];
});
const createSchema = zod_1.z.object({
    sku: zod_1.z.string().min(1),
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    price: zod_1.z.coerce.number().min(0),
    stock: zod_1.z.coerce.number().int().min(0).default(0),
    currency: zod_1.z.string().default("MNT"),
    status: zod_1.z.enum(["active", "hidden"]).optional(),
    images: ImagesSchema,
});
const updateSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    description: zod_1.z.string().optional(),
    price: zod_1.z.coerce.number().min(0).optional(),
    stock: zod_1.z.coerce.number().int().min(0).optional(),
    currency: zod_1.z.string().optional(),
    status: zod_1.z.enum(["active", "hidden"]).optional(),
    images: ImagesSchema,
});
const adjustSchema = zod_1.z.object({ delta: zod_1.z.coerce.number().int() });
// ---- Create ----
router.post("/", requirePageAccess_1.requirePageAccess, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    try {
        const pageId = req.pageId; // set by requirePageAccess
        const payload = Object.assign(Object.assign({}, parsed.data), { pageId }); // force tenant
        const doc = yield Products_1.default.create(payload);
        res.status(201).json(doc);
    }
    catch (e) {
        if ((e === null || e === void 0 ? void 0 : e.code) === 11000) {
            return res.status(409).json({ error: "SKU already exists for this page" });
        }
        console.error("Create failed:", e);
        res.status(500).json({ error: "Create failed" });
    }
}));
// ---- List (search + cursor) ----
router.get("/", requirePageAccess_1.requirePageAccess, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const pageId = req.pageId;
    const q = req.query.q || "";
    const limit = Math.min(parseInt(req.query.limit || "20", 10), 100);
    const cursor = req.query.cursor;
    const filter = { pageId };
    if (q)
        filter.$or = [{ name: { $regex: q, $options: "i" } }, { sku: { $regex: q, $options: "i" } }];
    if (cursor && mongoose_1.Types.ObjectId.isValid(String(cursor))) {
        // push cursor constraint into the filter itself
        filter._id = { $lt: new mongoose_1.Types.ObjectId(String(cursor)) };
    }
    const base = Products_1.default.find(filter).sort({ _id: -1 }).limit(limit + 1);
    const items = yield base.exec();
    const hasMore = items.length > limit;
    const pageItems = hasMore ? items.slice(0, limit) : items;
    const nextCursor = hasMore ? String(items[limit]._id) : null; // use the extra doc as cursor
    res.json({ items: pageItems, nextCursor });
}));
// ---- Get one ----
router.get("/:id", requirePageAccess_1.requirePageAccess, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const pageId = req.pageId;
    const item = yield Products_1.default.findOne({ _id: req.params.id, pageId });
    if (!item)
        return res.status(404).json({ error: "Not found" });
    res.json(item);
}));
// ---- Edit ----
router.patch("/:id", requirePageAccess_1.requirePageAccess, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const pageId = req.pageId;
    const updated = yield Products_1.default.findOneAndUpdate({ _id: req.params.id, pageId }, { $set: parsed.data }, { new: true });
    if (!updated)
        return res.status(404).json({ error: "Not found" });
    res.json(updated);
}));
// ---- Add / minus stock atomically (never below 0) ----
router.post("/:id/stock", requirePageAccess_1.requirePageAccess, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const parsed = adjustSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const { delta } = parsed.data;
    const pageId = req.pageId;
    const updated = yield Products_1.default.findOneAndUpdate({ _id: req.params.id, pageId, $expr: { $gte: [{ $add: ["$stock", delta] }, 0] } }, { $inc: { stock: delta } }, { new: true });
    if (!updated)
        return res.status(400).json({ error: "Insufficient stock or product not found" });
    res.json(updated);
}));
// ---- Delete ----
router.delete("/:id", requirePageAccess_1.requirePageAccess, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const pageId = req.pageId;
    const removed = yield Products_1.default.findOneAndDelete({ _id: req.params.id, pageId });
    if (!removed)
        return res.status(404).json({ error: "Not found" });
    res.json({ ok: true });
}));
exports.default = router;
