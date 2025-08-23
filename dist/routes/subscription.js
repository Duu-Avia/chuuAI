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
const zod_1 = require("zod");
const requirePageAccess_1 = require("../middleware/requirePageAccess");
const PageSettings_1 = __importDefault(require("../models/PageSettings"));
const PlanSchema = zod_1.z.enum(["starter", "pro", "enterprise"]);
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
/**
 * Activate (or change) plan and start 1-month subscription window.
 * POST /api/subscription/activate?pageId=... { plan: "starter" | "pro" | "enterprise" }
 */
router.post("/activate", requirePageAccess_1.requirePageAccess, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    const pageId = req.pageId;
    const parsed = PlanSchema.safeParse((_a = req.body) === null || _a === void 0 ? void 0 : _a.plan);
    if (!parsed.success) {
        return res.status(400).json({ error: "Invalid plan. Use 'starter' | 'pro' | 'enterprise'." });
    }
    const plan = parsed.data;
    const page = yield PageSettings_1.default.findOne({ pageId });
    if (!page)
        return res.status(404).json({ error: "Page not found" });
    const now = new Date();
    const base = page.subscriptionEndsAt && page.subscriptionEndsAt > now ? page.subscriptionEndsAt : now;
    page.plan = plan; // <-- persist the chosen plan
    page.subscriptionEndsAt = addMonthsClamped(base, 1);
    yield page.save();
    console.log("[/api/subscription/activate] saved", {
        pageId,
        plan: page.plan,
        subscriptionEndsAt: (_b = page.subscriptionEndsAt) === null || _b === void 0 ? void 0 : _b.toISOString(),
    });
    return res.json({
        ok: true,
        plan: page.plan,
        subscriptionEndsAt: (_d = (_c = page.subscriptionEndsAt) === null || _c === void 0 ? void 0 : _c.toISOString()) !== null && _d !== void 0 ? _d : null,
    });
}));
/**
 * Optional: renew 1 month without changing plan.
 * POST /api/subscription/renew?pageId=...
 */
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
    return res.json({
        ok: true,
        plan: page.plan,
        subscriptionEndsAt: page.subscriptionEndsAt.toISOString(),
    });
}));
exports.default = router;
