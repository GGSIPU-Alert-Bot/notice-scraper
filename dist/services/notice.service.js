"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLatestNotices = getLatestNotices;
exports.getLatestNoticeDate = getLatestNoticeDate;
exports.getNoticesSinceDate = getNoticesSinceDate;
exports.batchUpsertNotices = batchUpsertNotices;
const database_1 = __importDefault(require("../config/database"));
const client_1 = require("@prisma/client");
function getLatestNotices() {
    return __awaiter(this, arguments, void 0, function* (limit = 10) {
        return database_1.default.notice.findMany({
            take: limit,
            orderBy: { date: 'desc' },
        });
    });
}
function getLatestNoticeDate() {
    return __awaiter(this, void 0, void 0, function* () {
        const latestNotice = yield database_1.default.notice.findFirst({
            orderBy: { date: 'desc' },
            select: { date: true },
        });
        return latestNotice ? latestNotice.date : '01/01/2024'; // fallback date if no notices exist
    });
}
function getNoticesSinceDate(date) {
    return __awaiter(this, void 0, void 0, function* () {
        return database_1.default.notice.findMany({
            where: {
                date: {
                    gte: date,
                },
            },
            orderBy: { date: 'desc' },
        });
    });
}
function batchUpsertNotices(notices) {
    return __awaiter(this, void 0, void 0, function* () {
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
                const values = uniqueNotices.map(notice => client_1.Prisma.sql `(${notice.title}, ${notice.url}, ${notice.date})`);
                const query = client_1.Prisma.sql `
        INSERT INTO "Notice" (title, url, date)
        VALUES ${client_1.Prisma.join(values)}
        ON CONFLICT (title, url) DO UPDATE SET
          date = EXCLUDED.date
        WHERE "Notice".date <> EXCLUDED.date
      `;
                const affected = yield database_1.default.$executeRaw(query);
                totalAffected += affected;
                totalProcessed += batch.length;
                const progress = (totalProcessed / totalNotices * 100).toFixed(2);
                console.log(`Processed ${totalProcessed} of ${totalNotices} notices (${progress}%). Affected in this batch: ${affected}`);
            }
            catch (error) {
                console.error(`Error processing batch starting at index ${i}:`, error);
                if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
                    console.error('Prisma error details:', error.message);
                }
                // throw error;
            }
        }
        // Since we can't distinguish between inserts and updates easily,
        // we'll return the total affected rows as 'created' for simplicity
        console.log(`Finished processing all ${totalNotices} notices. Total affected: ${totalAffected}`);
        return { created: totalAffected, updated: 0, total: totalNotices };
    });
}
function deduplicateNotices(notices) {
    const uniqueNotices = new Map();
    let duplicatesCount = 0;
    for (const notice of notices) {
        const key = `${notice.title}|${notice.url}`;
        if (!uniqueNotices.has(key) || notice.date > uniqueNotices.get(key).date) {
            if (uniqueNotices.has(key)) {
                duplicatesCount++;
            }
            uniqueNotices.set(key, notice);
        }
        else {
            duplicatesCount++;
        }
    }
    console.log(`Found ${duplicatesCount} duplicates in batch of ${notices.length} notices`);
    return Array.from(uniqueNotices.values());
}
