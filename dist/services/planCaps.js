"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PLAN_CAPS = void 0;
exports.getCaps = getCaps;
exports.PLAN_CAPS = {
    starter: {
        features: {
            aiReply: true,
            storeProducts: true,
            adminDashboard: true,
            stockAlerts: false,
            orderButton: false,
            instagramPageIncluded: 0,
        },
        quotas: { messagesPerMonth: 1500 },
    },
    pro: {
        features: {
            aiReply: true,
            storeProducts: true,
            adminDashboard: true,
            stockAlerts: true,
            orderButton: true,
            instagramPageIncluded: 0,
        },
        quotas: { messagesPerMonth: 10000 },
    },
    enterprise: {
        features: {
            aiReply: true,
            storeProducts: true,
            adminDashboard: true,
            stockAlerts: true,
            orderButton: true,
            instagramPageIncluded: 1,
        },
        quotas: { messagesPerMonth: "unlimited" },
    },
};
function getCaps(plan, overrides) {
    var _a;
    const base = exports.PLAN_CAPS[plan];
    const messages = (_a = overrides === null || overrides === void 0 ? void 0 : overrides.messagesPerMonth) !== null && _a !== void 0 ? _a : base.quotas.messagesPerMonth;
    const ig = base.features.instagramPageIncluded + ((overrides === null || overrides === void 0 ? void 0 : overrides.extraInstagramPages) || 0);
    return {
        features: Object.assign(Object.assign({}, base.features), { instagramPageIncluded: ig }),
        quotas: { messagesPerMonth: messages },
    };
}
