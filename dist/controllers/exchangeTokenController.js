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
exports.exchangeToken = exchangeToken;
function exchangeToken(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { shortToken } = req.query;
        if (!shortToken) {
            return res.status(400).json({ error: "Missing shortToken" });
        }
        try {
            const appId = process.env.FACEBOOK_APP_ID;
            const appSecret = process.env.FACEBOOK_APP_SECRET;
            const exchangeUrl = `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortToken}`;
            const fbRes = yield fetch(exchangeUrl);
            const data = yield fbRes.json();
            if (!fbRes.ok) {
                console.error("❌ Token exchange failed:", data);
                return res.status(500).json({ error: "Token exchange failed" });
            }
            return res.json(data); // contains access_token
        }
        catch (err) {
            console.error("❌ Token exchange error:", err);
            return res.status(500).json({ error: "Internal error" });
        }
    });
}
