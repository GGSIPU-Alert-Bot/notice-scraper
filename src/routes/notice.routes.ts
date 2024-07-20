import express from 'express';
import * as noticeController from '../controllers/notice.controller';

const router = express.Router();

router.get('/latest', noticeController.getLatestNotices);

export default router;

