import express from 'express';
import { createFolder, listItems, updateItem, deleteItem } from '../controllers/item.controller.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = express.Router();

router.post('/folder', requireAuth, createFolder);
router.get('/', requireAuth, listItems);
router.patch('/:id', requireAuth, updateItem);
router.delete('/:id', requireAuth, deleteItem);

export default router;