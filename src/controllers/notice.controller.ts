import { Request, Response } from 'express';
import * as noticeService from '../services/notice.service';
import { scrapNotices } from '../utils/scraper';
import { Notice } from '../models/notice.model';


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
    console.log('Starting notice scraping and update process');
    const scrapedNotices = await scrapNotices();
    console.log(`Scraped ${scrapedNotices.length} notices`);

    const latestDate = await noticeService.getLatestNoticeDate();
    const recentDbNotices = await noticeService.getNoticesSinceDate(latestDate);
    const newOrUpdatedNotices = filterNewOrUpdatedNotices(scrapedNotices, recentDbNotices);

    if (newOrUpdatedNotices.length === 0) {
      console.log('No new or updated notices found. Skipping database update.');
      return;
    }

    console.log(`Found ${newOrUpdatedNotices.length} new or updated notices. Proceeding with database update.`);
    const result = await noticeService.batchUpsertNotices(newOrUpdatedNotices);
    console.log(`Notice processing completed. Created/Updated: ${result.created}, Total processed: ${result.total}`);
  } catch (error) {
    console.error('Error checking and updating notices:', error);
  }
}


function filterNewOrUpdatedNotices(scrapedNotices: Notice[], recentDbNotices: Notice[]): Notice[] {
  const dbNoticeSet = new Set(recentDbNotices.map(notice => `${notice.date}|${notice.title}|${notice.url}`));

  return scrapedNotices.filter(notice => {
    const noticeKey = `${notice.date}|${notice.title}|${notice.url}`;
    return !dbNoticeSet.has(noticeKey);
  });
}

function parseCustomDate(dateString: string): Date {
  const [day, month, year] = dateString.split('/').map(Number);
  return new Date(year, month - 1, day); // month is 0-indexed in JavaScript Date
}