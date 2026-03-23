import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import db from '../db';
import { authenticate, AuthRequest, JWT_SECRET_KEY } from '../middleware/auth';

const router = Router();

const safeUser = (u: any) => {
  if (!u) return null;
  delete u.password;
  u.skills = JSON.parse(u.skills || '[]');
  return u;
};

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, phone } = req.body;
    if (!name || !email || !password || !role) return res.status(400).json({ error: 'Missing required fields' });
    if (!['job_seeker', 'recruiter'].includes(role)) return res.status(400).json({ error: 'Invalid role' });

    const existing = await db.get('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);
    const id = uuidv4();
    await db.run('INSERT INTO users (id, name, email, password, role, phone) VALUES (?, ?, ?, ?, ?, ?)',
      [id, name, email, hashed, role, phone || null]);

    const token = jwt.sign({ id, role }, JWT_SECRET_KEY, { expiresIn: '7d' });
    const user = await db.get('SELECT * FROM users WHERE id = ?', [id]);
    res.json({ token, user: safeUser(user) });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing credentials' });

    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET_KEY, { expiresIn: '7d' });
    res.json({ token, user: safeUser(user) });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  const user = await db.get('SELECT * FROM users WHERE id = ?', [req.userId]);
  if (!user) return res.status(404).json({ error: 'Not found' });
  res.json(safeUser(user));
});

router.put('/profile', authenticate, async (req: AuthRequest, res: Response) => {
  const { name, phone, address, birthday, education, experience, skills, bio, company_name, company_description } = req.body;
  await db.run(`UPDATE users SET
    name=COALESCE(?,name), phone=COALESCE(?,phone), address=COALESCE(?,address),
    birthday=COALESCE(?,birthday), education=COALESCE(?,education),
    experience=COALESCE(?,experience), skills=COALESCE(?,skills),
    bio=COALESCE(?,bio), company_name=COALESCE(?,company_name),
    company_description=COALESCE(?,company_description), updated_at=datetime('now')
    WHERE id=?`,
    [name||null, phone||null, address||null, birthday||null, education||null,
     experience||null, skills?JSON.stringify(skills):null, bio||null,
     company_name||null, company_description||null, req.userId]);
  const user = await db.get('SELECT * FROM users WHERE id = ?', [req.userId]);
  res.json(safeUser(user));
});

export default router;
