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
const planCaps_1 = require("../services/planCaps"); // <- case sensitive
const usage_1 = require("../services/usage");
const requirePageAccess_1 = require("../middleware/requirePageAccess");
const router = (0, express_1.Router)();
// helper to coerce nullables into the shape getCaps expects
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
    var _a;
    const pageId = req.pageId;
    const page = yield PageSettings_1.default.findOne({ pageId }).lean();
    if (!page)
        return res.status(404).json({ error: "Not found" });
    const plan = ((_a = page.plan) !== null && _a !== void 0 ? _a : "starter");
    const caps = (0, planCaps_1.getCaps)(plan, normalizeOverrides(page.overrides));
    const usage = yield Usage_1.default.findOne({ pageId, month: (0, usage_1.monthKey)() }).lean();
    res.json({
        plan: page.plan,
        caps,
        usage: { month: (0, usage_1.monthKey)(), messages: (usage === null || usage === void 0 ? void 0 : usage.messages) || 0 },
    });
}));
exports.default = router;
