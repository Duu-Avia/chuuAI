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
exports.getReply = getReply;
const openai_1 = require("openai");
const PageSettings_1 = __importDefault(require("../models/PageSettings"));
const openai = new openai_1.OpenAI({ apiKey: process.env.OPENAI_API_KEY });
function getReply(text, pageId) {
    return __awaiter(this, void 0, void 0, function* () {
        const settings = yield PageSettings_1.default.findOne({ pageId });
        const prompt = (settings === null || settings === void 0 ? void 0 : settings.systemPrompt) || 'You are a friendly Mongolian AI assistant helping customers.';
        const response = yield openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: prompt },
                { role: 'user', content: text }
            ],
            temperature: 0.7,
        });
        return response.choices[0].message.content || 'Уучлаарай, ойлгосонгүй.';
    });
}
