import mongoose from 'mongoose';

const PageSettingsSchema = new mongoose.Schema({
  pageId:       { type: String, required: true, unique: true, index: true },
  name:         { type: String, required: true },
  accessToken:  { type: String, required: true },        // (encrypted already in your code)
  systemPrompt: {
    type: String,
    default: "you are a helpful assistant for selling products on this page every message should start with 'Hello! replying message from  ChuuAI chatbot'",
  },
  isSubscriber: { type: Boolean, default: false },
  ownerUserId:  { type: String, index: true },
}, { timestamps: true });

export default mongoose.model('PageSettings', PageSettingsSchema);
