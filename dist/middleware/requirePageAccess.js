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
exports.requirePageAccess = requirePageAccess;
const express_1 = require("@clerk/express");
const PageSettings_1 = __importDefault(require("../models/PageSettings"));
function requirePageAccess(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        const { userId } = (0, express_1.getAuth)(req);
        if (!userId)
            return res.status(401).json({ error: "Unauthorized" });
        const pageId = String(req.query.pageId || "");
        if (!pageId)
            return res.status(400).json({ error: "pageId is required" });
        const page = yield PageSettings_1.default.findOne({ pageId, ownerUserId: userId }).lean();
        if (!page)
            return res.status(403).json({ error: "No access to this pageId" });
        req.pageId = pageId;
        next();
    });
}
