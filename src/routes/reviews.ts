import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/user/:userId', async (req: AuthRequest, res: Response) => {
  const reviews = await db.query(`SELECT r.*, u.name as reviewer_name, u.avatar as reviewer_avatar
    FROM reviews r JOIN users u ON r.reviewer_id=u.id WHERE r.reviewed_id=? ORDER BY r.created_at DESC`, [req.params.userId]);
  const avg = reviews.length ? reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length : 0;
  res.json({ reviews, average: parseFloat(avg.toFixed(1)) });
});

router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  const { reviewed_id, rating, comment, context } = req.body;
  if (!reviewed_id || !rating) return res.status(400).json({ error: 'Missing fields' });
  await db.run('INSERT INTO reviews (id,reviewer_id,reviewed_id,rating,comment,context) VALUES (?,?,?,?,?,?)',
    [uuidv4(), req.userId, reviewed_id, rating, comment||null, context||null]);
  res.status(201).json({ message: 'Review submitted' });
});

export default router;
