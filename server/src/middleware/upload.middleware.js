import multer from 'multer';
import crypto from 'node:crypto';
import { UPLOAD_DIR } from '../services/storage.service.js';

const storage = multer.diskStorage({
 destination: (req, file, cb) => cb(null, UPLOAD_DIR), // where to save
 filename: (req, file, cb) => cb(null, crypto.randomUUID()), // what to call it (random)
});

const uploadSingle = multer({
 storage,
 limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB max; bigger uploads are rejected
}).single('file'); // accept ONE file, in the form field named "file"


export function handleUpload(req, res, next) {
 uploadSingle(req, res, (err) => {
 if (!err) return next(); // success: go to the controller
 if (err instanceof multer.MulterError) {
 if (err.code === 'LIMIT_FILE_SIZE') {
 return res.status(413).json({ message: 'File too large' }); // 413
 }
 return res.status(400).json({ message: err.message, code: err.code });
 }
 next(err); // unknown error: Express handles
 });
}