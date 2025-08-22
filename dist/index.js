"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv").config();
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const webhookController_1 = require("./controllers/webhookController");
const connectPageController_1 = require("./controllers/connectPageController");
const exchangeTokenController_1 = require("./controllers/exchangeTokenController");
const sendMessageController_1 = require("./controllers/sendMessageController");
const requirePageAccess_1 = require("./middleware/requirePageAccess");
const products_1 = __importDefault(require("./routes/products"));
const express_2 = require("@clerk/express");
const verifyMetaSignature_1 = require("./middleware/verifyMetaSignature");
const plan_1 = __importDefault(require("./routes/plan"));
const subscription_1 = __importDefault(require("./routes/subscription"));
const requireActiveSubscription_1 = require("./middleware/requireActiveSubscription");
const app = (0, express_1.default)();
// ✅ CORS Setup
const allowOrigins = [
    "https://chuuai-frontend.vercel.app",
    "https://www.chuuai.mn",
    "http://localhost:3000",
];
app.use((0, cors_1.default)({
    origin: allowOrigins,
    methods: ["GET", "POST", "OPTIONS", "PUT", "DELETE", "PATCH"],
    credentials: true,
}));
app.use(express_1.default.json({
    verify: (req, _res, buf) => { req.rawBody = buf; } // <-- store raw body for HMAC
}));
app.use((0, express_2.clerkMiddleware)());
// ✅ MongoDB Connect
mongoose_1.default
    .connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB connected"))
    .catch((err) => console.error("❌ MongoDB error:", err));
// ✅ Facebook Webhook Verification
app.get("/webhook", (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];
    if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
        console.log("✅ Webhook verified");
        res.status(200).send(challenge);
    }
    else {
        res.sendStatus(403);
    }
});
// ✅ Webhook + Token Exchange + Page Connect Routes
app.post("/webhook", verifyMetaSignature_1.verifyMetaSignature, webhookController_1.handleWebhook);
app.get("/api/exchange-token", exchangeTokenController_1.exchangeToken);
app.post("/api/connect-page", connectPageController_1.connectPage);
app.post("/api/send-message", sendMessageController_1.sendMessage);
app.use("/api/products", requirePageAccess_1.requirePageAccess, requireActiveSubscription_1.requireActiveSubscription, products_1.default);
app.use("/api/plan", plan_1.default);
app.use("/api/subscription", subscription_1.default);
// ✅ Required Meta App Review Pages
app.get("/privacy-policy", (req, res) => {
    res.send(`
    <h1>Privacy Policy</h1>
    <p>We respect your privacy. ChuuAI does not collect personal data. Messages are only used to generate AI responses and are not shared.</p>
  `);
});
app.get("/terms", (req, res) => {
    res.send(`
    <h1>Terms of Service</h1>
    <p>By using ChuuAI, you agree to receive automated replies. We are not liable for generated content. Use at your own discretion.</p>
  `);
});
app.get("/delete-data", (req, res) => {
    res.send(`
    <h1>Data Deletion Instructions</h1>
    <p>If you wish to delete your data, please email us at duuavia01@gmail.com with your Facebook Page ID.</p>
  `);
});
// ✅ Start Server
const PORT = process.env.PORT || 4200;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
