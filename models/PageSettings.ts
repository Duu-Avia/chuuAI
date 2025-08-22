// models/PageSettings.ts
import mongoose from 'mongoose';

const PageSettingsSchema = new mongoose.Schema({
  pageId:       { type: String, required: true, unique: true, index: true },
  name:         { type: String, required: true },
  accessToken:  { type: String, required: true },
  systemPrompt: {
    type: String,
    default:
      "you are a helpful assistant for selling products on this page every message should start with 'Hello! replying message from  ChuuAI chatbot'",
  },
  plan: { type: String, enum: ["starter", "pro", "enterprise"], default: "starter", index: true },
  ownerUserId:  { type: String, index: true },
  // ⬇️ move here
  subscriptionEndsAt: { type: Date, default: null },

  overrides: {
    messagesPerMonth: { type: Number },
    extraInstagramPages: { type: Number },
  },

}, { timestamps: true });

export default mongoose.model('PageSettings', PageSettingsSchema);
