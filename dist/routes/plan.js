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
// routes/plan.ts
const express_1 = require("express");
const PageSettings_1 = __importDefault(require("../models/PageSettings"));
const Usage_1 = __importDefault(require("../models/Usage"));
const planCaps_1 = require("../services/planCaps");
const usage_1 = require("../services/usage");
const requirePageAccess_1 = require("../middleware/requirePageAccess");
const router = (0, express_1.Router)();
function normalizeOverrides(o) {
    var _a, _b;
    if (!o)
        return undefined;
    return {
        messagesPerMonth: (_a = o.messagesPerMonth) !== null && _a !== void 0 ? _a : undefined,
        extraInstagramPages: (_b = o.extraInstagramPages) !== null && _b !== void 0 ? _b : undefined,
    };
}
router.get("/", requirePageAccess_1.requirePageAccess, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    const pageId = req.pageId;
    const page = yield PageSettings_1.default.findOne({ pageId }).lean();
    if (!page)
        return res.status(404).json({ error: "Not found" });
    const plan = ((_a = page.plan) !== null && _a !== void 0 ? _a : "starter");
    const caps = (0, planCaps_1.getCaps)(plan, normalizeOverrides(page.overrides));
    const usage = yield Usage_1.default.findOne({ pageId, month: (0, usage_1.monthKey)() }).lean();
    const messagesUsed = (_b = usage === null || usage === void 0 ? void 0 : usage.messages) !== null && _b !== void 0 ? _b : 0;
    const limit = caps.quotas.messagesPerMonth === "unlimited"
        ? Infinity
        : Number((_c = caps.quotas.messagesPerMonth) !== null && _c !== void 0 ? _c : 0);
    const limitExceeded = Number.isFinite(limit) && messagesUsed >= limit;
    // ---- compute subscription status once
    const rawEnds = (_d = page.subscriptionEndsAt) !== null && _d !== void 0 ? _d : null;
    const endsAt = rawEnds ? new Date(rawEnds) : null;
    const now = new Date();
    const subscriptionActive = !endsAt || endsAt > now;
    // 🔎 debug
    console.log("[/api/plan]", {
        pageId,
        plan,
        rawEnds,
        endsAtISO: endsAt ? endsAt.toISOString() : null,
        nowISO: now.toISOString(),
        subscriptionActive,
        messagesUsed,
        limit,
        limitExceeded,
    });
    return res.json({
        plan,
        caps,
        usage: { month: (0, usage_1.monthKey)(), messages: messagesUsed },
        subscriptionActive,
        subscriptionEndsAt: endsAt ? endsAt.toISOString() : null,
        limitExceeded,
    });
}));
exports.default = router;
