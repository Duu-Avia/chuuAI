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
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
// 🔗 Таны .env дотор MONGO_URI байх ёстой
const MONGO_URI = process.env.MONGO_URI || '';
// ✅ Product schema
const productSchema = new mongoose_1.default.Schema({
    name: String,
    description: String,
    price: Number,
    stock: Number,
});
const Product = mongoose_1.default.model('Product', productSchema);
// ✅ MongoDB-д холбогдох
function seed() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield mongoose_1.default.connect(MONGO_URI);
            console.log('📦 MongoDB холбогдлоо');
            // 🔄 Хуучин бүтээгдэхүүнүүдийг устгах (хүсвэл)
            yield Product.deleteMany();
            // 🧪 Шинэ бүтээгдэхүүнүүд нэмэх
            yield Product.insertMany([
                {
                    name: 'Хэтэ өвлийн куртик',
                    description: 'Хүйтэнд тохиромжтой усны хамгаалалттай куртик',
                    price: 150000,
                    stock: 12,
                },
                {
                    name: 'Нимгэн хаврын куртик',
                    description: 'Хаврын улиралд зориулсан нимгэн куртик',
                    price: 95000,
                    stock: 5,
                },
                {
                    name: 'Усны гутал',
                    description: 'Цастай, шавартай үед өмсөх усны гутал',
                    price: 70000,
                    stock: 0,
                },
            ]);
            console.log('✅ Бүтээгдэхүүнүүд нэмэгдлээ');
            process.exit(0);
        }
        catch (err) {
            console.error('❌ Алдаа:', err);
            process.exit(1);
        }
    });
}
seed();
