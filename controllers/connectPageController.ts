import { Request, Response } from 'express';
import PageSettings from '../models/PageSettings';

export async function connectPage(req: Request, res: Response) {
  try {
    const { pageId, pageAccessToken, pageName } = req.body;

    if (!pageId || !pageAccessToken || !pageName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await PageSettings.findOneAndUpdate(
      { pageId },
      {
        pageId,
        accessToken: pageAccessToken,
        name: pageName,
      },
      { upsert: true, new: true }
    );

    return res.status(200).json({ message: '✅ Page connected successfully' });
  } catch (error) {
    console.error('❌ connectPage error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
