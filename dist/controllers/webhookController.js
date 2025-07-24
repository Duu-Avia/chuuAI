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
function handleWebhook(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        try {
            const body = req.body;
            if (body.object !== 'page') {
                return res.sendStatus(404);
            }
            for (const entry of body.entry) {
                const pageId = entry.id;
                // ✅ Handle normal messages
                const messagingEvent = (_a = entry.messaging) === null || _a === void 0 ? void 0 : _a[0];
                if ((_b = messagingEvent === null || messagingEvent === void 0 ? void 0 : messagingEvent.message) === null || _b === void 0 ? void 0 : _b.text) {
                    const senderId = messagingEvent.sender.id;
                    const messageText = messagingEvent.message.text;
                    yield Message_1.default.create({
                        pageId,
                        senderId,
                        message: messageText,
                        timestamp: Date.now(),
                    });
                    const page = yield PageSettings_1.default.findOne({ pageId });
                    if (!page || !page.accessToken) {
                        console.error(`⚠️ No PageSettings found for pageId: ${pageId}`);
                        continue;
                    }
                    const reply = yield (0, aiService_1.getReply)(messageText, pageId);
                    yield fetch(`https://graph.facebook.com/v19.0/me/messages?access_token=${page.accessToken}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            recipient: { id: senderId },
                            message: { text: reply }
                        })
                    });
                }
                // ✅ Handle comment replies (from feed changes)
                if (entry.changes) {
                    for (const change of entry.changes) {
                        const value = change.value;
                        if (change.field === 'feed' && value.item === 'comment') {
                            const commentMessage = value.message;
                            const commenterId = (_c = value.from) === null || _c === void 0 ? void 0 : _c.id;
                            const commentId = value.comment_id;
                            console.log('📝 New comment:', commentMessage);
                            const triggerWords = ['medeelel', 'une', 'awii', 'info'];
                            const isInterested = triggerWords.some(word => commentMessage === null || commentMessage === void 0 ? void 0 : commentMessage.toLowerCase().includes(word));
                            if (!isInterested || !commentMessage || !commenterId)
                                continue;
                            const page = yield PageSettings_1.default.findOne({ pageId });
                            if (!page || !page.accessToken) {
                                console.warn(`⚠️ Page not found or missing token: ${pageId}`);
                                continue;
                            }
                            const reply = yield (0, aiService_1.getReply)(commentMessage, pageId);
                            // ✅ Use fetch for private reply to comment
                            yield fetch(`https://graph.facebook.com/v19.0/${commentId}/private_replies?access_token=${page.accessToken}`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    message: reply
                                })
                            });
                            console.log(`📩 Auto-DM sent to commenter: ${commenterId}`);
                        }
                    }
                }
            }
            res.status(200).send('EVENT_RECEIVED');
        }
        catch (err) {
            console.error('❌ Webhook error:', err);
            res.sendStatus(500);
        }
    });
}
