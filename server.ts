// server.ts (or app.ts)
import express from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";

const app = express();

app.use(cors({ origin: ["http://localhost:3000"], credentials: true }));
app.use(express.json());

// ✅ attach Clerk auth info to req.auth / enable token verification
app.use(clerkMiddleware());

// ...mount your routes here
export default app;
