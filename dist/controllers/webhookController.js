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
        var _a, _b;
        try {
            const body = req.body;
            if (body.object !== 'page') {
                return res.sendStatus(404);
            }
            for (const entry of body.entry) {
                const webhookEvent = (_a = entry.messaging) === null || _a === void 0 ? void 0 : _a[0];
                if (!webhookEvent || !((_b = webhookEvent.message) === null || _b === void 0 ? void 0 : _b.text))
                    continue;
                const senderId = webhookEvent.sender.id;
                const pageId = entry.id;
                const messageText = webhookEvent.message.text;
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
            res.status(200).send('EVENT_RECEIVED');
        }
        catch (err) {
            console.error('❌ Webhook error:', err);
            res.sendStatus(500);
        }
    });
}
