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
exports.connectPage = connectPage;
const PageSettings_1 = __importDefault(require("../models/PageSettings"));
const encryption_1 = require("../utils/encryption");
// 🔒 Import the encryption function
function connectPage(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { pageId, accessToken, pageName } = req.body;
            if (!pageId || !accessToken || !pageName) {
                return res.status(400).json({ error: "Missing required fields" });
            }
            const encryptedToken = (0, encryption_1.encrypt)(accessToken); // 🔐 Encrypt once
            console.log("🧪 Received raw token:", accessToken);
            console.log("🔐 Encrypted token (preview):", encryptedToken.slice(0, 30)); // Use the same one
            const savedPage = yield PageSettings_1.default.findOneAndUpdate({ pageId }, {
                pageId,
                accessToken: encryptedToken, // 🔐 Save encrypted
                name: pageName,
            }, { upsert: true, new: true });
            console.log("✅ Page connected:", savedPage.name);
            // Use raw token (not encrypted one) to subscribe to webhook
            const response = yield fetch(`https://graph.facebook.com/v19.0/${pageId}/subscribed_apps?subscribed_fields=messages,messaging_postbacks&access_token=${accessToken}`, { method: "POST" });
            const result = yield response.json();
            if (response.ok) {
                yield PageSettings_1.default.updateOne({ pageId }, { webhookSubscribed: true });
            }
            else {
                console.error("❌ Webhook subscription failed:", result);
                yield PageSettings_1.default.updateOne({ pageId }, { webhookSubscribed: false });
            }
            return res.status(200).json({ message: "✅ Page connected" });
        }
        catch (error) {
            console.error("❌ connectPage error:", error);
            return res.status(500).json({ error: "Internal server error" });
        }
    });
}
