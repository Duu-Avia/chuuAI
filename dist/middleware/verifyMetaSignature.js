"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyMetaSignature = verifyMetaSignature;
const crypto_1 = __importDefault(require("crypto"));
function verifyMetaSignature(req, res, next) {
    const signature = req.header("x-hub-signature-256"); // "sha256=<hex>"
    const appSecret = process.env.FACEBOOK_APP_SECRET;
    if (!appSecret) {
        console.error("FACEBOOK_APP_SECRET missing");
        return res.sendStatus(500);
    }
    if (!signature || !req.rawBody) {
        return res.sendStatus(401);
    }
    const expected = "sha256=" +
        crypto_1.default.createHmac("sha256", appSecret).update(req.rawBody).digest("hex");
    // timing-safe compare
    const sigBuf = Buffer.from(signature, "utf8");
    const expBuf = Buffer.from(expected, "utf8");
    if (sigBuf.length !== expBuf.length || !crypto_1.default.timingSafeEqual(sigBuf, expBuf)) {
        console.warn("Invalid webhook signature");
        return res.sendStatus(403);
    }
    return next();
}
// Optional default export (keeps both named & default imports valid)
exports.default = verifyMetaSignature;
