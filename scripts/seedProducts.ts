import mongoose from 'mongoose';
import { config } from 'dotenv';
config();

// 🔗 Таны .env дотор MONGO_URI байх ёстой
const MONGO_URI = process.env.MONGO_URI || '';

// ✅ Product schema
const productSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  stock: Number,
});

const Product = mongoose.model('Product', productSchema);

// ✅ MongoDB-д холбогдох
async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('📦 MongoDB холбогдлоо');

    // 🔄 Хуучин бүтээгдэхүүнүүдийг устгах (хүсвэл)
    await Product.deleteMany();

    // 🧪 Шинэ бүтээгдэхүүнүүд нэмэх
    await Product.insertMany([
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
  } catch (err) {
    console.error('❌ Алдаа:', err);
    process.exit(1);
  }
}

seed();
