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
// routes/subscription.ts
const express_1 = require("express");
const requirePageAccess_1 = require("../middleware/requirePageAccess");
const PageSettings_1 = __importDefault(require("../models/PageSettings"));
function addMonthsClamped(date, months) {
    const d = new Date(date);
    const day = d.getDate();
    d.setDate(1);
    d.setMonth(d.getMonth() + months);
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(day, lastDay));
    return d;
}
const router = (0, express_1.Router)();
router.post("/renew", requirePageAccess_1.requirePageAccess, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const pageId = req.pageId;
    const page = yield PageSettings_1.default.findOne({ pageId });
    if (!page)
        return res.status(404).json({ error: "Page not found" });
    const base = page.subscriptionEndsAt && page.subscriptionEndsAt > new Date()
        ? page.subscriptionEndsAt
        : new Date();
    page.subscriptionEndsAt = addMonthsClamped(base, 1);
    yield page.save();
    res.json({ ok: true, subscriptionEndsAt: page.subscriptionEndsAt.toISOString() });
}));
exports.default = router;
