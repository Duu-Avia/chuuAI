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
exports.connectPage = connectPage;
const PageSettings_1 = __importDefault(require("../models/PageSettings"));
function connectPage(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { pageId, accessToken, pageName } = req.body;
            console.log("📥 Received connect-page request:", {
                pageId,
                accessToken,
                pageName,
            });
            if (!pageId || !accessToken || !pageName) {
                console.warn("⚠️ Missing required fields");
                return res.status(400).json({ error: "Missing required fields" });
            }
            const savedPage = yield PageSettings_1.default.findOneAndUpdate({ pageId }, {
                pageId,
                accessToken,
                name: pageName,
            }, { upsert: true, new: true });
            console.log("✅ Page saved or updated in DB:", savedPage);
            return res.status(200).json({ message: "✅ Page connected successfully" });
        }
        catch (error) {
            console.error("❌ connectPage error:", error);
            return res.status(500).json({ error: "Internal server error" });
        }
    });
}
