import express from 'express';
import cors from 'cors';
import path from 'path';
import { initDb } from './db';
import authRoutes from './routes/auth';
import jobRoutes from './routes/jobs';
import marketplaceRoutes from './routes/marketplace';
import matchmakingRoutes from './routes/matchmaking';
import reviewRoutes from './routes/reviews';

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/matchmaking', matchmakingRoutes);
app.use('/api/reviews', reviewRoutes);

app.get('/api', (req, res) => res.json({ message: '✅ Yone Kyi API running!', version: '1.0.0' }));
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Init DB then start server
initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🚀 Yone Kyi API → http://localhost:${PORT}/api\n`);
  });
}).catch(err => {
  console.error('Failed to init database:', err);
  process.exit(1);
});

export default app;
