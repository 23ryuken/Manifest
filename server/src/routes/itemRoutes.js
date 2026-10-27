import express from 'express';
import { createFolder, listItems } from '../controllers/item.controller.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = express.Router();

router.post('/folder', requireAuth, createFolder);
router.get('/', requireAuth, listItems);

export default router;