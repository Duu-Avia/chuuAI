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
exports.handleWebhook = handleWebhook;
const PageSettings_1 = __importDefault(require("../models/PageSettings"));
const aiService_1 = require("../services/aiService");
const Message_1 = __importDefault(require("../models/Message"));
const encryption_1 = require("../utils/encryption");
const planCaps_1 = require("../services/planCaps"); // ⬅️ NEW
const usage_1 = require("../services/usage"); // ⬅️ NEW
// normalize overrides so getCaps gets clean numbers (no nulls)
function normalizeOverrides(o) {
    var _a, _b;
    if (!o)
        return undefined;
    return {
        messagesPerMonth: (_a = o.messagesPerMonth) !== null && _a !== void 0 ? _a : undefined,
        extraInstagramPages: (_b = o.extraInstagramPages) !== null && _b !== void 0 ? _b : undefined,
    };
}
function handleWebhook(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        try {
            const body = req.body;
            console.log("📥 Webhook received:", JSON.stringify(body, null, 2));
            if (body.object !== "page") {
                console.log("❌ Not a page event:", body.object);
                return res.sendStatus(404);
            }
            for (const entry of (_a = body.entry) !== null && _a !== void 0 ? _a : []) {
                const pageId = entry.id;
                console.log("📄 Page ID:", pageId);
                const events = (_b = entry.messaging) !== null && _b !== void 0 ? _b : [];
                for (const evt of events) {
                    const senderId = (_c = evt === null || evt === void 0 ? void 0 : evt.sender) === null || _c === void 0 ? void 0 : _c.id;
                    if (!senderId)
                        continue;
                    // Extract the incoming text (or mark as attachment)
                    const text = (typeof ((_d = evt === null || evt === void 0 ? void 0 : evt.message) === null || _d === void 0 ? void 0 : _d.text) === "string" && evt.message.text) ||
                        (typeof ((_e = evt === null || evt === void 0 ? void 0 : evt.postback) === null || _e === void 0 ? void 0 : _e.payload) === "string" && evt.postback.payload) ||
                        (typeof ((_g = (_f = evt === null || evt === void 0 ? void 0 : evt.message) === null || _f === void 0 ? void 0 : _f.quick_reply) === null || _g === void 0 ? void 0 : _g.payload) === "string" && evt.message.quick_reply.payload) ||
                        null;
                    const hasAttachment = Array.isArray((_h = evt === null || evt === void 0 ? void 0 : evt.message) === null || _h === void 0 ? void 0 : _h.attachments) && evt.message.attachments.length > 0;
                    const normalizedText = text !== null && text !== void 0 ? text : (hasAttachment ? "[attachment]" : null);
                    if (!normalizedText)
                        continue;
                    console.log("✉️ Incoming message");
                    console.log("👤 Sender ID:", senderId);
                    console.log("💬 Message Text:", normalizedText);
                    // Best-effort: save inbound message
                    try {
                        yield Message_1.default.create({
                            pageId,
                            senderId,
                            message: normalizedText,
                            timestamp: Date.now(),
                        });
                    }
                    catch (e) {
                        console.error("⚠️ Message.create failed:", e);
                    }
                    // Load page settings + token
                    const page = yield PageSettings_1.default.findOne({ pageId }).lean();
                    if (!page || !page.accessToken) {
                        console.error(`⚠️ No PageSettings/accessToken found for pageId: ${pageId}`);
                        continue;
                    }
                    const decryptedToken = (0, encryption_1.decrypt)(page.accessToken);
                    // ---- PLAN CAPS + MONTHLY MESSAGE LIMIT (NEW) ----
                    const plan = ((_j = page.plan) !== null && _j !== void 0 ? _j : "starter");
                    const caps = (0, planCaps_1.getCaps)(plan, normalizeOverrides(page.overrides));
                    // If AI replies are disabled for this plan, just skip replying
                    if (!caps.features.aiReply) {
                        console.log("⛔ aiReply feature disabled for this plan, skipping reply.");
                        continue;
                    }
                    // Enforce monthly message quota BEFORE calling AI
                    const { allowed, current } = yield (0, usage_1.tryConsumeMessage)(pageId, caps.quotas.messagesPerMonth);
                    if (!allowed) {
                        console.log(`⛔ Monthly message limit reached. Current: ${current}`);
                        // Optionally notify the end user politely
                        try {
                            const fbRes = yield fetch(`https://graph.facebook.com/v19.0/me/messages?access_token=${decryptedToken}`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    recipient: { id: senderId },
                                    message: {
                                        text: "📈 Сарын мессежийн хязгаарт хүрлээ. Илүү их мессеж ашиглахын тулд багцаа шинэчилнэ үү.",
                                    },
                                }),
                            });
                            // Ignore body parsing errors
                            try {
                                yield fbRes.json();
                            }
                            catch (_k) { }
                        }
                        catch (e) {
                            console.error("❌ Facebook send (limit reached) error:", e);
                        }
                        continue; // do not call AI
                    }
                    // ---- END PLAN/LIMIT LOGIC ----
                    // Call AI safely
                    let reply = "Уучлаарай, одоогоор боловсруулахад алдаа гарлаа.";
                    try {
                        reply = yield (0, aiService_1.getReply)(normalizedText, pageId);
                    }
                    catch (e) {
                        console.error("⚠️ getReply error:", e);
                    }
                    console.log("🤖 Generated Reply:", reply);
                    // Send reply back to Facebook
                    try {
                        const fbRes = yield fetch(`https://graph.facebook.com/v19.0/me/messages?access_token=${decryptedToken}`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                recipient: { id: senderId },
                                message: { text: reply },
                            }),
                        });
                        let fbJson = {};
                        try {
                            fbJson = yield fbRes.json();
                        }
                        catch (_l) {
                            // Some responses may not have a JSON body
                        }
                        if (!fbRes.ok) {
                            console.error("❌ Facebook send error:", fbJson);
                        }
                        else {
                            console.log("📬 Facebook Response:", fbJson);
                        }
                    }
                    catch (e) {
                        console.error("❌ Facebook fetch error:", e);
                    }
                }
            }
            // Always ACK to stop Meta retries
            return res.status(200).send("EVENT_RECEIVED");
        }
        catch (err) {
            console.error("❌ Webhook error:", err);
            return res.sendStatus(500);
        }
    });
}
