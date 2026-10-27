import express from 'express';
import { createFolder, listItems, updateItem, deleteItem, uploadFile, downloadFile } from '../controllers/item.controller.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { handleUpload } from '../middleware/upload.middleware.js';


const router = express.Router();

router.post('/folder', requireAuth, createFolder);
router.get('/', requireAuth, listItems);
router.patch('/:id', requireAuth, updateItem);
router.delete('/:id', requireAuth, deleteItem);
router.post('/upload', requireAuth, handleUpload, uploadFile);
router.get('/:id/download', requireAuth, downloadFile);


export default router;