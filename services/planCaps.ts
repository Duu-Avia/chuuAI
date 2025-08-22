export type Plan = 'starter' | 'pro' | 'enterprise';

export type Features = {
 aiReply: boolean;
 storeProducts: boolean;
 adminDashboard: boolean;
 stockAlerts: boolean;
 orderButton: boolean;
 instagramPageIncluded: number;
}

export type Caps = {
 features: Features;
 quotas: {messagesPerMonth: number | "unlimited"};
}

export const PLAN_CAPS: Record<Plan, Caps> ={
 starter: {
  features:{
   aiReply: true,
   storeProducts: true,
   adminDashboard: true,
   stockAlerts: false,
   orderButton: false,
   instagramPageIncluded: 0,
  },
   quotas: {messagesPerMonth: 1500},
},
 pro: {
  features:{
   aiReply: true,
   storeProducts: true,
   adminDashboard: true,
   stockAlerts: true,
   orderButton: true,
   instagramPageIncluded: 0,
   },
   quotas: {messagesPerMonth: 10000},
 },

 enterprise: {
  features:{
   aiReply: true,
   storeProducts: true,
   adminDashboard: true,
   stockAlerts: true,
   orderButton: true,
   instagramPageIncluded: 1,
   },
   quotas: {messagesPerMonth: "unlimited"},
 },

}

export function getCaps(plan: Plan, overrides?: { messagesPerMonth?: number; extraInstagramPages?: number }): Caps {
  const base = PLAN_CAPS[plan];
  const messages =
    overrides?.messagesPerMonth ?? base.quotas.messagesPerMonth;
  const ig = base.features.instagramPageIncluded + (overrides?.extraInstagramPages || 0);
  return {
    features: { ...base.features, instagramPageIncluded: ig },
    quotas: { messagesPerMonth: messages },
  };
}