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
exports.sendMessage = sendMessage;
const PageSettings_1 = __importDefault(require("../models/PageSettings"));
const encryption_1 = require("../utils/encryption");
function sendMessage(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { pageId, recipientId, text } = req.body;
            if (!pageId || !recipientId || !text) {
                return res.status(400).json({ error: "Missing pageId, recipientId, or text" });
            }
            const page = yield PageSettings_1.default.findOne({ pageId });
            if (!(page === null || page === void 0 ? void 0 : page.accessToken)) {
                return res.status(404).json({ error: "Page not found or missing token" });
            }
            const token = (0, encryption_1.decrypt)(page.accessToken);
            const fbRes = yield fetch(`https://graph.facebook.com/v23.0/me/messages?access_token=${token}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messaging_type: "RESPONSE",
                    recipient: { id: recipientId }, // PSID
                    message: { text }
                })
            });
            const data = yield fbRes.json();
            if (!fbRes.ok)
                return res.status(400).json({ error: "Facebook send failed", details: data });
            return res.json({ ok: true, data });
        }
        catch (e) {
            console.error("sendMessage error:", e);
            return res.status(500).json({ error: "Internal server error" });
        }
    });
}
