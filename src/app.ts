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

// Set up cron job to run every 20 seconds
new CronJob('*/20 * * * * *', checkAndUpdateNotices, null, true);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});