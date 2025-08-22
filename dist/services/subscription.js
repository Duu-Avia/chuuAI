"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startOrRenewSubscription = startOrRenewSubscription;
const PageSettings_1 = __importDefault(require("../models/PageSettings"));
// adds months but clamps end-of-month correctly
function addMonthsClamped(date, months) {
    const d = new Date(date);
    const day = d.getDate();
    d.setDate(1);
    d.setMonth(d.getMonth() + months);
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(day, lastDay));
    return d;
}
function startOrRenewSubscription(pageId_1) {
    return __awaiter(this, arguments, void 0, function* (pageId, months = 1) {
        const page = yield PageSettings_1.default.findOne({ pageId });
        if (!page)
            throw new Error("Page not found");
        const base = page.subscriptionEndsAt && page.subscriptionEndsAt > new Date()
            ? page.subscriptionEndsAt
            : new Date();
        page.subscriptionEndsAt = addMonthsClamped(base, months);
        yield page.save();
        return page.subscriptionEndsAt;
    });
}
