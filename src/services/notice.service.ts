import prisma from '../config/database';
import { Notice } from '../models/notice.model';
import { Prisma } from '@prisma/client';

export async function getLatestNotices(limit: number = 10): Promise<Notice[]> {
  try {
    const notices = await prisma.notice.findMany({
      take: limit,
      orderBy: { date: 'desc' },
    });

    // Normalize dates before returning
    return notices.map(notice => ({
      ...notice,
      date: validateAndNormalizeDate(notice.date),
    }));
  } catch (error) {
    console.error('Error fetching latest notices:', error);
    throw error; // Re-throw the error after logging it
  }
}

export async function getLatestNoticeDate(): Promise<string> {
  try {
    const latestNotice = await prisma.notice.findFirst({
      orderBy: { date: 'desc' },
      select: { date: true },
    });

    return latestNotice ? validateAndNormalizeDate(latestNotice.date) : '2024-01-01'; // fallback date if no notices exist
  } catch (error) {
    console.error('Error fetching latest notice date:', error);
    throw error;
  }
}

export async function getNoticesSinceDate(date: string): Promise<Notice[]> {
  try {
    return prisma.notice.findMany({
      where: {
        date: {
          gte: validateAndNormalizeDate(date),
        },
      },
      orderBy: { date: 'desc' },
    });
  } catch (error) {
    console.error('Error fetching notices since date:', error);
    throw error;
  }
}

export async function batchUpsertNotices(notices: Notice[]): Promise<{ created: number, updated: number, total: number }> {
  let totalAffected = 0;
  let totalProcessed = 0;
  let created = 0;
  let updated = 0;

  const batchSize = 5000; // based on your database capabilities
  const totalNotices = notices.length;

  console.log(`Starting to process ${totalNotices} notices`);

  for (let i = 0; i < notices.length; i += batchSize) {
    const batch = notices.slice(i, i + batchSize);

    try {
      // Normalize and deduplicate notices within the batch
      const uniqueNotices = deduplicateNotices(batch.map(notice => ({
        ...notice,
        date: validateAndNormalizeDate(notice.date),
      })));

      const values = uniqueNotices.map(notice =>
        Prisma.sql`(${notice.title}, ${notice.url}, ${notice.date})`
      );

      const query = Prisma.sql`
        INSERT INTO "Notice" (title, url, date)
        VALUES ${Prisma.join(values)}
        ON CONFLICT (title, url) DO UPDATE SET
          date = EXCLUDED.date
        WHERE "Notice".date <> EXCLUDED.date
      `;

      const affected = await prisma.$executeRaw(query);

      totalAffected += affected;
      totalProcessed += batch.length;

      // Estimate the number of created and updated notices
      created += affected; // assuming all affected rows are new
      // updated logic might need adjusting based on your actual result handling

      const progress = (totalProcessed / totalNotices * 100).toFixed(2);
      console.log(`Processed ${totalProcessed} of ${totalNotices} notices (${progress}%). Affected in this batch: ${affected}`);

    } catch (error) {
      console.error(`Error processing batch starting at index ${i}:`, error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        console.error('Prisma error details:', error.message);
      }
    }
  }

  console.log(`Finished processing all ${totalNotices} notices. Total affected: ${totalAffected}`);

  return { created, updated, total: totalNotices };
}

function deduplicateNotices(notices: Notice[]): Notice[] {
  const uniqueNotices = new Map<string, Notice>();
  let duplicatesCount = 0;

  for (const notice of notices) {
    const key = `${notice.title}|${notice.url}`;
    if (!uniqueNotices.has(key) || new Date(notice.date) > new Date(uniqueNotices.get(key)!.date)) {
      if (uniqueNotices.has(key)) {
        duplicatesCount++;
      }
      uniqueNotices.set(key, notice);
    } else {
      duplicatesCount++;
    }
  }
  console.log(`Found ${duplicatesCount} duplicates in batch of ${notices.length} notices`);

  return Array.from(uniqueNotices.values());
}

function validateAndNormalizeDate(dateString: string): string {
  if (dateString === 'Unknown' || dateString === 'Invalid date') {
    console.warn(`Invalid date format: ${dateString}`);
    return 'Invalid date';
  }

  const isoFormatRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (isoFormatRegex.test(dateString)) {
    return dateString;
  }

  const parts = dateString.split('/');
  if (parts.length !== 3) {
    console.warn(`Invalid date format: ${dateString}`);
    return 'Invalid date';
  }

  const [day, month, year] = parts.map(Number);
  if (isNaN(day) || isNaN(month) || isNaN(year)) {
    console.warn(`Invalid date value: ${dateString}`);
    return 'Invalid date';
  }

  const date = new Date(year, month - 1, day);
  if (isNaN(date.getTime())) {
    console.warn(`Invalid date value: ${dateString}`);
    return 'Invalid date';
  }

  return date.toISOString().split('T')[0];
}
