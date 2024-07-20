import prisma from '../config/database';
import { Notice } from '../models/notice.model';

export async function getLatestNotices(limit: number = 10): Promise<Notice[]> {
  return prisma.notice.findMany({
    take: limit,
    orderBy: { createdAt: 'desc' },
  });
}

export async function createNotice(notice: Notice): Promise<Notice> {
  return prisma.notice.create({
    data: notice,
  });
}

export async function getNoticeByTitleAndUrl(title: string, url: string): Promise<Notice | null> {
  console.log(`Checking for existing notice with title: ${title}, url: ${url}`);
  return prisma.notice.findFirst({
    where: {
      AND: [
        { title: title },
        { url: url }
      ]
    }
  });
}

export async function upsertNotice(notice: Notice): Promise<Notice | null> {
  return prisma.$transaction(async (prisma) => {
    const existingNotice = await prisma.notice.findFirst({
      where: {
        AND: [
          { title: notice.title },
          { url: notice.url }
        ]
      }
    });

    if (!existingNotice) {
      const createdNotice = await prisma.notice.create({
        data: notice,
      });
      console.log('Created notice:', JSON.stringify(createdNotice, null, 2));
      return createdNotice;
    } else {
      console.log('Notice already exists:', JSON.stringify(existingNotice, null, 2));
      return null;
    }
  });
}
