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
const express_1 = require("@clerk/express");
const PageSettings_1 = __importDefault(require("../models/PageSettings"));
const encryption_1 = require("../utils/encryption");
function connectPage(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // 1) Who is calling? (your CLIENT's Clerk user id)
            const { userId } = (0, express_1.getAuth)(req);
            if (!userId)
                return res.status(401).json({ error: "Unauthorized" });
            // 2) Validate input
            const { pageId, accessToken, pageName } = req.body;
            if (!pageId || !accessToken || !pageName) {
                return res.status(400).json({ error: "Missing required fields" });
            }
            // 3) If page already exists and belongs to someone else -> block
            const existing = yield PageSettings_1.default.findOne({ pageId }).lean();
            if (existing && existing.ownerUserId && existing.ownerUserId !== userId) {
                return res.status(403).json({ error: "This page is already connected by another account." });
            }
            // 4) Save encrypted token + owner
            const encryptedToken = (0, encryption_1.encrypt)(accessToken);
            const savedPage = yield PageSettings_1.default.findOneAndUpdate({ pageId }, { pageId, name: pageName, accessToken: encryptedToken, ownerUserId: userId }, { upsert: true, new: true, setDefaultsOnInsert: true });
            console.log("✅ Page connected:", savedPage.name, "by", userId);
            // 5) Subscribe webhook with RAW token
            const fbRes = yield fetch(`https://graph.facebook.com/v19.0/${pageId}/subscribed_apps?subscribed_fields=messages,messaging_postbacks&access_token=${accessToken}`, { method: "POST" });
            const fbJson = yield fbRes.json().catch(() => ({}));
            yield PageSettings_1.default.updateOne({ pageId }, { webhookSubscribed: fbRes.ok });
            return res.status(200).json({
                ok: true,
                pageId: savedPage.pageId,
                name: savedPage.name,
                webhookSubscribed: fbRes.ok,
                fb: fbRes.ok ? undefined : fbJson, // include FB error if any
            });
        }
        catch (error) {
            console.error("❌ connectPage error:", error);
            return res.status(500).json({ error: "Internal server error" });
        }
    });
}
