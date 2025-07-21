// scripts/addPage.ts
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import PageSettings from '../models/PageSettings';

dotenv.config();

async function main() {
  await mongoose.connect(process.env.MONGO_URI!);
  await PageSettings.create({
    pageId: 'YOUR_FACEBOOK_PAGE_ID',
    accessToken: 'YOUR_PAGE_ACCESS_TOKEN',
    systemPrompt: 'Та бол автомашины үйлчилгээний chatbot. Та хэрэглэгчийн асуултад маш тодорхой, мэргэжлийн байдлаар хариулна.'
  });
  console.log('✅ Page added');
  process.exit();
}

main();
