"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const PageSettingsSchema = new mongoose_1.default.Schema({
    pageId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    accessToken: { type: String, required: true },
    systemPrompt: {
        type: String,
        default: "you are a helpful assistant for selling products on this page every message should start with 'Hello! replying message from  ChuuAI chatbot'",
    },
    isSubscriber: { type: Boolean, default: false },
    ownerUserId: { type: String, index: true },
    plan: {
        type: String,
        enum: ["starter", "pro", "enterprise"],
        default: "starter",
        index: true,
    },
    overrides: {
        messagesPerMonth: { type: Number },
        extraInstagramPages: { type: Number },
    }
}, { timestamps: true });
exports.default = mongoose_1.default.model('PageSettings', PageSettingsSchema);
