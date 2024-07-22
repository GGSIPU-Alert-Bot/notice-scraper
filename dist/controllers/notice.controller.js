"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLatestNotices = getLatestNotices;
exports.checkAndUpdateNotices = checkAndUpdateNotices;
const noticeService = __importStar(require("../services/notice.service"));
const scraper_1 = require("../utils/scraper");
function getLatestNotices(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const notices = yield noticeService.getLatestNotices();
            res.json(notices);
        }
        catch (error) {
            console.error('Error in getLatestNotices:', error);
            res.status(500).json({ error: 'Failed to fetch notices' });
        }
    });
}
function checkAndUpdateNotices() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('Starting notice scraping and update process');
            const scrapedNotices = yield (0, scraper_1.scrapNotices)();
            console.log(`Scraped ${scrapedNotices.length} notices`);
            const latestDate = yield noticeService.getLatestNoticeDate();
            const recentDbNotices = yield noticeService.getNoticesSinceDate(latestDate);
            const newOrUpdatedNotices = filterNewOrUpdatedNotices(scrapedNotices, recentDbNotices);
            if (newOrUpdatedNotices.length === 0) {
                console.log('No new or updated notices found. Skipping database update.');
                return;
            }
            console.log(`Found ${newOrUpdatedNotices.length} new or updated notices. Proceeding with database update.`);
            const result = yield noticeService.batchUpsertNotices(newOrUpdatedNotices);
            console.log(`Notice processing completed. Created/Updated: ${result.created}, Total processed: ${result.total}`);
        }
        catch (error) {
            console.error('Error checking and updating notices:', error);
        }
    });
}
function filterNewOrUpdatedNotices(scrapedNotices, recentDbNotices) {
    const dbNoticeSet = new Set(recentDbNotices.map(notice => `${notice.date}|${notice.title}|${notice.url}`));
    return scrapedNotices.filter(notice => {
        const noticeKey = `${notice.date}|${notice.title}|${notice.url}`;
        return !dbNoticeSet.has(noticeKey);
    });
}
