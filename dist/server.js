"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// server.ts (or app.ts)
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const express_2 = require("@clerk/express");
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: ["http://localhost:3000"], credentials: true }));
app.use(express_1.default.json());
// ✅ attach Clerk auth info to req.auth / enable token verification
app.use((0, express_2.clerkMiddleware)());
// ...mount your routes here
exports.default = app;
