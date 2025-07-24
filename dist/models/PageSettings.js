"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const PageSettingsSchema = new mongoose_1.default.Schema({
    pageId: { type: String, required: true },
    name: { type: String, required: true },
    accessToken: { type: String, required: true },
    systemPrompt: {
        type: String,
        default: "you are a helpful assistant for selling products on this page",
    },
    webhookSubscribed: { type: Boolean, default: false }, // ✅ NEW
});
const PageSettings = mongoose_1.default.model('PageSettings', PageSettingsSchema);
exports.default = PageSettings;
