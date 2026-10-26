import express from 'express';
import { createFolder } from '../controllers/item.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/folder', requireAuth, createFolder);

export default router;