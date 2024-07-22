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
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const notices = yield database_1.default.notice.findMany({
                orderBy: { date: 'desc' },
            });
            // Normalize dates before returning
            return notices.map(notice => (Object.assign(Object.assign({}, notice), { date: validateAndNormalizeDate(notice.date) })));
        }
        catch (error) {
            console.error('Error fetching latest notices:', error);
            throw error; // Re-throw the error after logging it
        }
    });
}
function getLatestNoticeDate() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const latestNotice = yield database_1.default.notice.findFirst({
                orderBy: { date: 'desc' },
                select: { date: true },
            });
            return latestNotice ? validateAndNormalizeDate(latestNotice.date) : '2024-01-01'; // fallback date if no notices exist
        }
        catch (error) {
            console.error('Error fetching latest notice date:', error);
            throw error;
        }
    });
}
function getNoticesSinceDate(date) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return database_1.default.notice.findMany({
                where: {
                    date: {
                        gte: validateAndNormalizeDate(date),
                    },
                },
                orderBy: { date: 'desc' },
            });
        }
        catch (error) {
            console.error('Error fetching notices since date:', error);
            throw error;
        }
    });
}
function batchUpsertNotices(notices) {
    return __awaiter(this, void 0, void 0, function* () {
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
                const uniqueNotices = deduplicateNotices(batch.map(notice => (Object.assign(Object.assign({}, notice), { date: validateAndNormalizeDate(notice.date) }))));
                const values = uniqueNotices.map(notice => client_1.Prisma.sql `(${notice.title}, ${encodeURL(notice.url)}, ${notice.date})`);
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
                // Estimate the number of created and updated notices
                created += affected; // assuming all affected rows are new
                // updated logic might need adjusting based on your actual result handling
                const progress = (totalProcessed / totalNotices * 100).toFixed(2);
                console.log(`Processed ${totalProcessed} of ${totalNotices} notices (${progress}%). Affected in this batch: ${affected}`);
            }
            catch (error) {
                console.error(`Error processing batch starting at index ${i}:`, error);
                if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
                    console.error('Prisma error details:', error.message);
                }
            }
        }
        console.log(`Finished processing all ${totalNotices} notices. Total affected: ${totalAffected}`);
        return { created, updated, total: totalNotices };
    });
}
function deduplicateNotices(notices) {
    const uniqueNotices = new Map();
    let duplicatesCount = 0;
    for (const notice of notices) {
        const key = `${notice.title}|${notice.url}`;
        if (!uniqueNotices.has(key) || new Date(notice.date) > new Date(uniqueNotices.get(key).date)) {
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
function validateAndNormalizeDate(dateString) {
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
function encodeURL(url) {
    return url.replace(/ /g, '%20');
}
