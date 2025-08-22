"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const UsageSchema = new mongoose_1.default.Schema({
    pageId: { type: String, required: true, index: true },
    month: { type: String, required: true }, // "YYYY-MM"
    messages: { type: Number, default: 0 },
    // NEW (optional, for analytics / future caps)
    promptTokens: { type: Number, default: 0 },
    completionTokens: { type: Number, default: 0 },
    costCents: { type: Number, default: 0 },
}, { timestamps: true });
UsageSchema.index({ pageId: 1, month: 1 }, { unique: true });
exports.default = mongoose_1.default.model("Usage", UsageSchema);
