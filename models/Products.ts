// models/Product.ts
import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema(
  {
    pageId: { type: String, required: true, index: true },
    sku: { type: String, required: true },
    name: { type: String, required: true },
    description: String,
    price: { type: Number, default: 0 },
    stock: { type: Number, default: 0 },
    currency: { type: String, default: "MNT" },
    images: [{ type: String }],
    status: { type: String, enum: ["active", "archived"], default: "active" },
  },
  { timestamps: true }
);

// Uniqueness within a tenant:
ProductSchema.index({ pageId: 1, sku: 1 }, { unique: true });

export default mongoose.model("Product", ProductSchema);
