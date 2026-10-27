import express from 'express';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import itemRoutes from './routes/itemRoutes.js';

const app = express();

const PORT = process.env.PORT || 4002;

app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

await connectDB();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});