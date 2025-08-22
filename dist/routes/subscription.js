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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const requirePageAccess_1 = require("../middleware/requirePageAccess");
const subscription_1 = require("../services/subscription");
const router = (0, express_1.Router)();
router.post("/renew", requirePageAccess_1.requirePageAccess, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const pageId = req.pageId;
        const endsAt = yield (0, subscription_1.startOrRenewSubscription)(pageId, 1);
        res.json({ ok: true, subscriptionEndsAt: endsAt.toISOString() });
    }
    catch (e) {
        res.status(500).json({ error: e.message || "Renew failed" });
    }
}));
exports.default = router;
