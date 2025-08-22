import Usage from "../models/Usage";

export function monthKey(d = new Date()) {
  return d.toISOString().slice(0, 7); // "YYYY-MM"
}

// (you already have this) — keep as-is
export async function tryConsumeMessage(pageId: string, limit: number | "unlimited") {
  const month = monthKey();
  if (limit === "unlimited") {
    const doc = await Usage.findOneAndUpdate(
      { pageId, month },
      { $inc: { messages: 1 }, $setOnInsert: { promptTokens: 0, completionTokens: 0, costCents: 0 } },
      { upsert: true, new: true }
    );
    return { allowed: true, current: doc.messages };
  }

  const doc = await Usage.findOneAndUpdate(
    { pageId, month },
    { $setOnInsert: { messages: 0, promptTokens: 0, completionTokens: 0, costCents: 0 } },
    { upsert: true, new: true }
  );

  if (doc.messages >= limit) return { allowed: false, current: doc.messages };

  const updated = await Usage.findOneAndUpdate(
    { _id: doc._id, messages: { $lt: limit } },
    { $inc: { messages: 1 } },
    { new: true }
  );

  return { allowed: !!updated, current: updated?.messages ?? doc.messages };
}

// NEW: record tokens/cost after the AI call (optional now, useful later)
export async function recordAiUsage(
  pageId: string,
  { promptTokens = 0, completionTokens = 0, costCents = 0 }: { promptTokens?: number; completionTokens?: number; costCents?: number }
) {
  const month = monthKey();
  await Usage.updateOne(
    { pageId, month },
    {
      $setOnInsert: { messages: 0, promptTokens: 0, completionTokens: 0, costCents: 0 },
      $inc: { promptTokens, completionTokens, costCents },
    },
    { upsert: true }
  );
}
