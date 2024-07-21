import prisma from '../config/database';
import { Notice } from '../models/notice.model';
import { Prisma } from '@prisma/client';

export async function getLatestNotices(limit: number = 10): Promise<Notice[]> {
  return prisma.notice.findMany({
    take: limit,
    orderBy: { date: 'desc' },
  });
}

export async function getLatestNoticeDate(): Promise<string> {
  const latestNotice = await prisma.notice.findFirst({
    orderBy: { date: 'desc' },
    select: { date: true },
  });
  return latestNotice ? latestNotice.date : '01/01/2024'; // fallback date if no notices exist
}

export async function getNoticesSinceDate(date: string): Promise<Notice[]> {
  return prisma.notice.findMany({
    where: {
      date: {
        gte: date,
      },
    },
    orderBy: { date: 'desc' },
  });
}

export async function batchUpsertNotices(notices: Notice[]): Promise<{ created: number, updated: number,total: number }> {
  let totalAffected = 0;
  let totalProcessed = 0;


  const batchSize = 5000; // based on your database capabilities
  const totalNotices = notices.length;

  console.log(`Starting to process ${totalNotices} notices`);


  for (let i = 0; i < notices.length; i += batchSize) {
    const batch = notices.slice(i, i + batchSize);

    try {
      // Deduplicate notices within the batch
      const uniqueNotices = deduplicateNotices(batch);

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

      const progress = (totalProcessed / totalNotices * 100).toFixed(2);
      console.log(`Processed ${totalProcessed} of ${totalNotices} notices (${progress}%). Affected in this batch: ${affected}`);

    } catch (error) {
      console.error(`Error processing batch starting at index ${i}:`, error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        console.error('Prisma error details:', error.message);
      }
      // throw error;
    }
  }

  // Since we can't distinguish between inserts and updates easily,
  // we'll return the total affected rows as 'created' for simplicity
  console.log(`Finished processing all ${totalNotices} notices. Total affected: ${totalAffected}`);

  return { created: totalAffected, updated: 0 ,total: totalNotices};
}

function deduplicateNotices(notices: Notice[]): Notice[] {
  const uniqueNotices = new Map<string, Notice>();
  let duplicatesCount = 0;


  for (const notice of notices) {
    const key = `${notice.title}|${notice.url}`;
    if (!uniqueNotices.has(key) || notice.date > uniqueNotices.get(key)!.date) {
      if (uniqueNotices.has(key)) {
        duplicatesCount++;
      }
      uniqueNotices.set(key, notice);
    }else {
      duplicatesCount++;
    }
  }
  console.log(`Found ${duplicatesCount} duplicates in batch of ${notices.length} notices`);

  return Array.from(uniqueNotices.values());
}