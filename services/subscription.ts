import PageSettings from "../models/PageSettings";

// adds months but clamps end-of-month correctly
function addMonthsClamped(date: Date, months: number) {
  const d = new Date(date);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, lastDay));
  return d;
}

export async function startOrRenewSubscription(pageId: string, months = 1) {
  const page = await PageSettings.findOne({ pageId });
  if (!page) throw new Error("Page not found");

  const base = page.subscriptionEndsAt && page.subscriptionEndsAt > new Date()
    ? page.subscriptionEndsAt
    : new Date();

  page.subscriptionEndsAt = addMonthsClamped(base, months);
  await page.save();
  return page.subscriptionEndsAt;
}
