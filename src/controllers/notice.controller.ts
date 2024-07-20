import { Request, Response } from 'express';
import * as noticeService from '../services/notice.service';
import { scrapNotices } from '../utils/scraper';

export async function getLatestNotices(req: Request, res: Response) {
  try {
    const notices = await noticeService.getLatestNotices();
    res.json(notices);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notices' });
  }
}

export async function checkAndUpdateNotices() {
  try {
    const newNotices = await scrapNotices();
    console.log(`Scraped ${newNotices.length} notices`);

    if (newNotices.length === 0) {
      console.log('No notices found by scraper. Skipping database update.');
      return;
    }

    let updatedCount = 0;
    const processedUrls = new Set();

    for (const notice of newNotices) {
      if (!processedUrls.has(notice.url)) {
        processedUrls.add(notice.url);
        const createdNotice = await noticeService.upsertNotice(notice);

        if (createdNotice) {
          updatedCount++;
        }
      }
    }

    if (updatedCount > 0) {
      console.log(`Database updated with ${updatedCount} new notices.`);
    } else {
      console.log('No new notices found.');
    }
  } catch (error) {
    console.error('Error checking and updating notices:', error);
  }
}
