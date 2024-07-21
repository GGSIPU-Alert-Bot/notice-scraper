"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cron_1 = require("cron");
const notice_routes_1 = __importDefault(require("./routes/notice.routes"));
const notice_controller_1 = require("./controllers/notice.controller");
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
app.use('/notices', notice_routes_1.default);
app.get('/', (_, res) => {
    res.json({ message: 'Welcome, Services are running!' });
});
//cron jobs to run at 8 AM, 11AM, 1 PM, 3 PM, 5 PM, and 10 PM every day.
new cron_1.CronJob('0 8 * * *', notice_controller_1.checkAndUpdateNotices, null, true);
new cron_1.CronJob('0 11 * * *', notice_controller_1.checkAndUpdateNotices, null, true);
new cron_1.CronJob('0 13 * * *', notice_controller_1.checkAndUpdateNotices, null, true);
new cron_1.CronJob('0 15 * * *', notice_controller_1.checkAndUpdateNotices, null, true);
new cron_1.CronJob('0 17 * * *', notice_controller_1.checkAndUpdateNotices, null, true);
new cron_1.CronJob('0 22 * * *', notice_controller_1.checkAndUpdateNotices, null, true);
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
