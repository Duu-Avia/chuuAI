import { OpenAI } from 'openai';
import Products from '../models/Products';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Fetch product info from MongoDB
async function fetchProductContext(): Promise<string> {
  const products = await Products.find({});
  if (!products || products.length === 0) return 'Одоогоор бараа олдсонгүй.';

  return products.map((p:any) => 
    `Нэр: ${p.name}, Үнэ: ${p.price}₮, Үлдэгдэл: ${p.stock}`
  ).join('\n');
}

export async function getReply(text: string): Promise<string> {
  const productContext = await fetchProductContext();

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: `Чи Монгол хэрэглэгчдэд тусалдаг эелдэг чатбот. Дараах бараануудын мэдээллийг хэрэглэгчид танилцуулж, асуултад нь бараа болон үлдэгдэл дээр үндэслэн хариу өг: \n${productContext}` },
      {role: 'system', content: 'you can answer question about products have or not but you cannot answer how much it remained'},
      { role: 'user', content: text }
    ],
    temperature: 0.7,
  });

  return response.choices[0].message.content || 'Уучлаарай, ойлгосонгүй.';
}
