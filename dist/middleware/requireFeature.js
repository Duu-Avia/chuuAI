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
exports.requireFeature = requireFeature;
const PageSettings_1 = __importDefault(require("../models/PageSettings"));
const planCaps_1 = require("../services/planCaps");
function requireFeature(feature) {
    return (req, res, next) => __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        const pageId = req.pageId;
        if (!pageId)
            return res.status(400).json({ error: "Missing pageId" });
        const page = yield PageSettings_1.default.findOne({ pageId }).lean();
        if (!page)
            return res.status(404).json({ error: "Page not found" });
        // Normalize plan & overrides safely
        const plan = ((_a = page.plan) !== null && _a !== void 0 ? _a : "starter");
        const overrides = page.overrides
            ? {
                // accept either messagesPerMonth OR legacy messagePerMonth
                messagesPerMonth: (_c = (_b = page.overrides.messagesPerMonth) !== null && _b !== void 0 ? _b : page.overrides.messagePerMonth) !== null && _c !== void 0 ? _c : undefined,
                extraInstagramPages: (_d = page.overrides.extraInstagramPages) !== null && _d !== void 0 ? _d : undefined,
            }
            : undefined;
        const caps = (0, planCaps_1.getCaps)(plan, overrides);
        if (!caps.features[feature]) {
            return res.status(403).json({ error: `Your plan doesn't include ${feature}` });
        }
        return next();
    });
}
