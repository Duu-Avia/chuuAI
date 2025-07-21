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
// scripts/addPage.ts
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const PageSettings_1 = __importDefault(require("../models/PageSettings"));
dotenv_1.default.config();
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        yield mongoose_1.default.connect(process.env.MONGO_URI);
        yield PageSettings_1.default.create({
            pageId: 'YOUR_FACEBOOK_PAGE_ID',
            accessToken: 'YOUR_PAGE_ACCESS_TOKEN',
            systemPrompt: 'Та бол автомашины үйлчилгээний chatbot. Та хэрэглэгчийн асуултад маш тодорхой, мэргэжлийн байдлаар хариулна.'
        });
        console.log('✅ Page added');
        process.exit();
    });
}
main();
