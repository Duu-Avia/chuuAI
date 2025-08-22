import mongoose from "mongoose";

const UsageSchema = new mongoose.Schema(
  {
    pageId: { type: String, required: true, index: true },
    month: { type: String, required: true }, // "YYYY-MM"
    messages: { type: Number, default: 0 },

    // NEW (optional, for analytics / future caps)
    promptTokens: { type: Number, default: 0 },
    completionTokens: { type: Number, default: 0 },
    costCents: { type: Number, default: 0 },
  },
  { timestamps: true }
);

UsageSchema.index({ pageId: 1, month: 1 }, { unique: true });

export default mongoose.model("Usage", UsageSchema);
