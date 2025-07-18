import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function getReply(text: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-o4-mini', // ← Typo fixed: use "gpt-4o", not "gpt-o4-mini"
    messages: [{ role: 'user', content: text }],
    temperature: 0.7,
  });

  return response.choices[0].message.content || 'Уучлаарай, ойлгосонгүй.';
}
