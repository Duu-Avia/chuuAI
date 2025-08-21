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
exports.listProducts = listProducts;
exports.createProduct = createProduct;
exports.updateProduct = updateProduct;
exports.deleteProduct = deleteProduct;
exports.adjustStock = adjustStock;
const Products_1 = __importDefault(require("../models/Products"));
// GET /products?pageId=...
function listProducts(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { pageId } = req.query;
        if (!pageId)
            return res.status(400).json({ error: "pageId is required" });
        const items = yield Products_1.default.find({ pageId }).sort({ createdAt: -1 }).lean();
        return res.json(items);
    });
}
// POST /products?pageId=...
function createProduct(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { pageId } = req.query;
        if (!pageId)
            return res.status(400).json({ error: "pageId is required" });
        try {
            const payload = Object.assign(Object.assign({}, req.body), { pageId }); // force tenant
            const created = yield Products_1.default.create(payload);
            return res.status(201).json(created);
        }
        catch (e) {
            if ((e === null || e === void 0 ? void 0 : e.code) === 11000) {
                return res.status(409).json({ error: "SKU already exists for this page" });
            }
            return res.status(500).json({ error: "Create failed" });
        }
    });
}
// PUT /products/:id?pageId=...
function updateProduct(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { pageId } = req.query;
        const { id } = req.params;
        if (!pageId)
            return res.status(400).json({ error: "pageId is required" });
        const updated = yield Products_1.default.findOneAndUpdate({ _id: id, pageId }, Object.assign(Object.assign({}, req.body), { pageId }), // force tenant
        { new: true });
        if (!updated)
            return res.status(404).json({ error: "Not found" });
        return res.json(updated);
    });
}
// DELETE /products/:id?pageId=...
function deleteProduct(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { pageId } = req.query;
        const { id } = req.params;
        if (!pageId)
            return res.status(400).json({ error: "pageId is required" });
        const deleted = yield Products_1.default.findOneAndDelete({ _id: id, pageId });
        if (!deleted)
            return res.status(404).json({ error: "Not found" });
        return res.json({ ok: true });
    });
}
// POST /products/:id/stock?pageId=... { delta: number }
function adjustStock(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { pageId } = req.query;
        const { id } = req.params;
        const { delta } = req.body;
        if (!pageId)
            return res.status(400).json({ error: "pageId is required" });
        if (typeof delta !== "number")
            return res.status(400).json({ error: "delta must be a number" });
        // clamp to >= 0
        const current = yield Products_1.default.findOne({ _id: id, pageId });
        if (!current)
            return res.status(404).json({ error: "Not found" });
        const next = Math.max(0, (current.stock || 0) + delta);
        current.stock = next;
        yield current.save();
        return res.json(current);
    });
}
