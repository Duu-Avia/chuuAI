"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// models/Product.ts
const mongoose_1 = __importDefault(require("mongoose"));
const ProductSchema = new mongoose_1.default.Schema({
    pageId: { type: String, required: true, index: true },
    sku: { type: String, required: true },
    name: { type: String, required: true },
    description: String,
    price: { type: Number, default: 0 },
    stock: { type: Number, default: 0 },
    currency: { type: String, default: "MNT" },
    images: [{ type: String }],
    status: { type: String, enum: ["active", "archived"], default: "active" },
}, { timestamps: true });
// Uniqueness within a tenant:
ProductSchema.index({ pageId: 1, sku: 1 }, { unique: true });
exports.default = mongoose_1.default.model("Product", ProductSchema);
