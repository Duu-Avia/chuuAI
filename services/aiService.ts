import { OpenAI } from 'openai';
import PageSettings from '../models/PageSettings';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function getReply(text: string, pageId: string): Promise<string> {
  const settings = await PageSettings.findOne({ pageId });
  const prompt = settings?.systemPrompt || 'You are a friendly Mongolian AI assistant helping customers.';

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: prompt },
      { role: 'user', content: text }
    ],
    temperature: 0.7,
  });

  return response.choices[0].message.content || 'Уучлаарай, ойлгосонгүй.';
}
