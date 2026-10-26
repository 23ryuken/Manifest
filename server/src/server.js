import express from 'express';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.routes.js';

const app = express();

const PORT = process.env.PORT || 4002;

app.use(express.json());
app.use('/api/auth', authRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

await connectDB();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});