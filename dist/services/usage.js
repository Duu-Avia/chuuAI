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
exports.monthKey = monthKey;
exports.tryConsumeMessage = tryConsumeMessage;
exports.recordAiUsage = recordAiUsage;
const Usage_1 = __importDefault(require("../models/Usage"));
function monthKey(d = new Date()) {
    return d.toISOString().slice(0, 7); // "YYYY-MM"
}
// (you already have this) — keep as-is
function tryConsumeMessage(pageId, limit) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const month = monthKey();
        if (limit === "unlimited") {
            const doc = yield Usage_1.default.findOneAndUpdate({ pageId, month }, { $inc: { messages: 1 }, $setOnInsert: { promptTokens: 0, completionTokens: 0, costCents: 0 } }, { upsert: true, new: true });
            return { allowed: true, current: doc.messages };
        }
        const doc = yield Usage_1.default.findOneAndUpdate({ pageId, month }, { $setOnInsert: { messages: 0, promptTokens: 0, completionTokens: 0, costCents: 0 } }, { upsert: true, new: true });
        if (doc.messages >= limit)
            return { allowed: false, current: doc.messages };
        const updated = yield Usage_1.default.findOneAndUpdate({ _id: doc._id, messages: { $lt: limit } }, { $inc: { messages: 1 } }, { new: true });
        return { allowed: !!updated, current: (_a = updated === null || updated === void 0 ? void 0 : updated.messages) !== null && _a !== void 0 ? _a : doc.messages };
    });
}
// NEW: record tokens/cost after the AI call (optional now, useful later)
function recordAiUsage(pageId_1, _a) {
    return __awaiter(this, arguments, void 0, function* (pageId, { promptTokens = 0, completionTokens = 0, costCents = 0 }) {
        const month = monthKey();
        yield Usage_1.default.updateOne({ pageId, month }, {
            $setOnInsert: { messages: 0, promptTokens: 0, completionTokens: 0, costCents: 0 },
            $inc: { promptTokens, completionTokens, costCents },
        }, { upsert: true });
    });
}
