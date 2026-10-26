import express from 'express';
import { connectDB } from './config/db.js';

const app = express();

const PORT = process.env.PORT || 4002;

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

await connectDB();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});