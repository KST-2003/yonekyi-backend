import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/profile', authenticate, async (req: AuthRequest, res: Response) => {
  const p = await db.get('SELECT * FROM matchmaking_profiles WHERE user_id = ?', [req.userId]);
  if (p) { p.interests = JSON.parse(p.interests||'[]'); p.photos = JSON.parse(p.photos||'[]'); }
  res.json(p || null);
});

router.post('/profile', authenticate, async (req: AuthRequest, res: Response) => {
  const { age, gender, bio, interests, preferred_area, preferred_age_min, preferred_age_max, preferred_education, preferred_work_field, photos } = req.body;
  const existing = await db.get('SELECT id FROM matchmaking_profiles WHERE user_id = ?', [req.userId]);
  if (existing) {
    await db.run(`UPDATE matchmaking_profiles SET age=COALESCE(?,age),gender=COALESCE(?,gender),bio=COALESCE(?,bio),interests=COALESCE(?,interests),preferred_area=COALESCE(?,preferred_area),preferred_age_min=COALESCE(?,preferred_age_min),preferred_age_max=COALESCE(?,preferred_age_max),preferred_education=COALESCE(?,preferred_education),preferred_work_field=COALESCE(?,preferred_work_field),photos=COALESCE(?,photos),is_active=1,updated_at=datetime('now') WHERE user_id=?`,
      [age??null,gender||null,bio||null,interests?JSON.stringify(interests):null,preferred_area||null,preferred_age_min??null,preferred_age_max??null,preferred_education||null,preferred_work_field||null,photos?JSON.stringify(photos):null,req.userId]);
  } else {
    await db.run(`INSERT INTO matchmaking_profiles (id,user_id,age,gender,bio,interests,preferred_area,preferred_age_min,preferred_age_max,preferred_education,preferred_work_field,photos) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [uuidv4(),req.userId,age||null,gender||null,bio||null,JSON.stringify(interests||[]),preferred_area||null,preferred_age_min||18,preferred_age_max||60,preferred_education||null,preferred_work_field||null,JSON.stringify(photos||[])]);
  }
  res.json({ message: 'Saved' });
});

router.get('/candidates', authenticate, async (req: AuthRequest, res: Response) => {
  const candidates = await db.query(`SELECT mp.*, u.name, u.email, u.education, u.experience, u.skills, u.avatar, u.address
    FROM matchmaking_profiles mp JOIN users u ON mp.user_id = u.id
    WHERE mp.user_id != ? AND mp.is_active = 1
    AND mp.user_id NOT IN (SELECT to_user_id FROM match_actions WHERE from_user_id = ?)
    ORDER BY mp.boost_until DESC LIMIT 20`, [req.userId, req.userId]);
  candidates.forEach((c: any) => {
    c.interests = JSON.parse(c.interests||'[]');
    c.photos = JSON.parse(c.photos||'[]');
    c.skills = JSON.parse(c.skills||'[]');
  });
  res.json(candidates);
});

router.post('/action', authenticate, async (req: AuthRequest, res: Response) => {
  const { to_user_id, action } = req.body;
  if (!['like','pass','super_like'].includes(action)) return res.status(400).json({ error: 'Invalid action' });
  const existing = await db.get('SELECT id FROM match_actions WHERE from_user_id = ? AND to_user_id = ?', [req.userId, to_user_id]);
  if (existing) return res.status(409).json({ error: 'Already acted' });
  await db.run('INSERT INTO match_actions (id,from_user_id,to_user_id,action) VALUES (?,?,?,?)', [uuidv4(),req.userId,to_user_id,action]);
  let isMatch = false;
  if (action === 'like' || action === 'super_like') {
    const theyLiked = await db.get(`SELECT id FROM match_actions WHERE from_user_id = ? AND to_user_id = ? AND action IN ('like','super_like')`, [to_user_id, req.userId]);
    if (theyLiked) {
      const exists = await db.get('SELECT id FROM matches WHERE (user1_id=? AND user2_id=?) OR (user1_id=? AND user2_id=?)', [req.userId,to_user_id,to_user_id,req.userId]);
      if (!exists) { await db.run('INSERT INTO matches (id,user1_id,user2_id) VALUES (?,?,?)', [uuidv4(),req.userId,to_user_id]); isMatch = true; }
    }
  }
  res.json({ isMatch });
});

router.get('/matches', authenticate, async (req: AuthRequest, res: Response) => {
  const matches = await db.query(`SELECT m.*,
    CASE WHEN m.user1_id=? THEN u2.name ELSE u1.name END as match_name,
    CASE WHEN m.user1_id=? THEN u2.avatar ELSE u1.avatar END as match_avatar,
    CASE WHEN m.user1_id=? THEN m.user2_id ELSE m.user1_id END as match_user_id
    FROM matches m JOIN users u1 ON m.user1_id=u1.id JOIN users u2 ON m.user2_id=u2.id
    WHERE m.user1_id=? OR m.user2_id=? ORDER BY m.created_at DESC`,
    [req.userId,req.userId,req.userId,req.userId,req.userId]);
  res.json(matches);
});

router.get('/matches/:matchId/messages', authenticate, async (req: AuthRequest, res: Response) => {
  const match = await db.get('SELECT id FROM matches WHERE id=? AND (user1_id=? OR user2_id=?)', [req.params.matchId,req.userId,req.userId]);
  if (!match) return res.status(404).json({ error: 'Not found' });
  const msgs = await db.query(`SELECT msg.*, u.name as sender_name, u.avatar as sender_avatar FROM messages msg JOIN users u ON msg.sender_id=u.id WHERE msg.match_id=? ORDER BY msg.created_at ASC`, [req.params.matchId]);
  res.json(msgs);
});

router.post('/matches/:matchId/messages', authenticate, async (req: AuthRequest, res: Response) => {
  const match = await db.get('SELECT id FROM matches WHERE id=? AND (user1_id=? OR user2_id=?)', [req.params.matchId,req.userId,req.userId]);
  if (!match) return res.status(404).json({ error: 'Not found' });
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: 'Content required' });
  const id = uuidv4();
  await db.run('INSERT INTO messages (id,match_id,sender_id,content) VALUES (?,?,?,?)', [id,req.params.matchId,req.userId,content]);
  const msg = await db.get(`SELECT msg.*, u.name as sender_name FROM messages msg JOIN users u ON msg.sender_id=u.id WHERE msg.id=?`, [id]);
  res.status(201).json(msg);
});

export default router;
