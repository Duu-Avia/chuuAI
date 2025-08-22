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
exports.requireActiveSubscription = requireActiveSubscription;
const PageSettings_1 = __importDefault(require("../models/PageSettings"));
function requireActiveSubscription(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        const pageId = req.pageId;
        if (!pageId)
            return res.status(400).json({ error: "Missing pageId" });
        const page = yield PageSettings_1.default.findOne({ pageId }).lean();
        if (!page)
            return res.status(404).json({ error: "Page not found" });
        const ends = page.subscriptionEndsAt ? new Date(page.subscriptionEndsAt) : null;
        const active = !ends || ends > new Date();
        if (!active) {
            return res.status(402).json({ error: "expired", message: "Таны багцын хугацаа дууссан байна" });
        }
        return next();
    });
}
