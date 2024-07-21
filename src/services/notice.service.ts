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

export async function getNoticeByTitleAndUrl(title: string, url: string): Promise<Notice[] | null> {
  console.log(`Checking for existing notice with title: ${title}, url: ${url}`);
  return prisma.notice.findMany({
    where: {
      AND: [
        { title: title },
        { url: url }
      ]
    }
  });
}

export async function deleteNoticesByIds(ids: number[]): Promise<void> {
  await prisma.notice.deleteMany({
    where: {
      id: {
        in: ids
      }
    }
  });
  console.log(`Deleted notices with ids: ${ids}`)
}

export async function upsertNotice(notice: Notice): Promise<Notice | null> {
  const existingNotices = await getNoticeByTitleAndUrl(notice.title, notice.url);

  if (existingNotices && existingNotices.length > 1) {
    // Delete all but one
    const idsToDelete = existingNotices.slice(1).map(n => n.id).filter((id): id is number => id !== undefined);
    await deleteNoticesByIds(idsToDelete);
    console.log(`Deleted ${idsToDelete.length} duplicate notices`);
    console.log('\n')
    console.log('\n')
    console.log('\n')
    console.log('\n')
    console.log('\n')
    console.log('\n')
    console.log('\n')
  }

  if (!existingNotices || existingNotices.length === 0) {
    const createdNotice = await prisma.notice.create({
      data: notice,
    });
    console.log('Created notice:', JSON.stringify(createdNotice, null, 2));
    return createdNotice;
  } else {
    console.log('Notice already exists:', JSON.stringify(existingNotices[0], null, 2));
    return null;
  }
}