import express from 'express';
import { CronJob } from 'cron';
import noticeRoutes from './routes/notice.routes';
import { checkAndUpdateNotices } from './controllers/notice.controller';

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Route handling for notices
app.use('/notices', noticeRoutes);

app.get('/', (_, res) => {
  res.json({ message: 'Welcome, Services are running!' });
});

// Cron job to run at the start of every hour every day.
new CronJob('0 * * * *', checkAndUpdateNotices, null, true);

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
