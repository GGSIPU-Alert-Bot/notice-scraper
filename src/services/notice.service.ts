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
  return prisma.notice.findFirst({
    where: {
      AND: [
        { title: title },
        { url: url }
      ]
    }
  });
}