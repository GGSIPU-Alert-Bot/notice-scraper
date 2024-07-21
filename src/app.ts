import express from 'express';
import { CronJob } from 'cron';
import noticeRoutes from './routes/notice.routes';
import { checkAndUpdateNotices } from './controllers/notice.controller';

const app = express();
const port = process.env.PORT || 3000;

app.use('/notices', noticeRoutes);

app.get('/', (_, res) => {
  res.json({ message: 'Welcome, Services are running!' });
});

//cron jobs to run at 8 AM, 11AM, 1 PM, 3 PM, 5 PM, and 10 PM every day.
new CronJob('0 8 * * *', checkAndUpdateNotices, null, true);
new CronJob('0 11 * * *', checkAndUpdateNotices, null, true);
new CronJob('0 13 * * *', checkAndUpdateNotices, null, true);
new CronJob('0 15 * * *', checkAndUpdateNotices, null, true);
new CronJob('0 17 * * *', checkAndUpdateNotices, null, true);
new CronJob('0 22 * * *', checkAndUpdateNotices, null, true);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});