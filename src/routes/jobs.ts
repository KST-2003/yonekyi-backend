import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';

const router = Router();

router.get('/my/applications', authenticate, requireRole('job_seeker'), async (req: AuthRequest, res: Response) => {
  const apps = await db.query(`SELECT ja.*, j.title, j.company, j.location, j.job_type, j.salary_min, j.salary_max, j.currency
    FROM job_applications ja JOIN jobs j ON ja.job_id = j.id
    WHERE ja.applicant_id = ? ORDER BY ja.created_at DESC`, [req.userId]);
  res.json(apps);
});

router.get('/my/posted', authenticate, requireRole('recruiter'), async (req: AuthRequest, res: Response) => {
  const jobs = await db.query(`SELECT j.*, COUNT(ja.id) as application_count
    FROM jobs j LEFT JOIN job_applications ja ON j.id = ja.job_id
    WHERE j.recruiter_id = ? GROUP BY j.id ORDER BY j.created_at DESC`, [req.userId]);
  res.json(jobs);
});

router.get('/applications/:appId', authenticate, async (req: AuthRequest, res: Response) => {
  res.json({});
});

router.put('/applications/:appId/status', authenticate, requireRole('recruiter'), async (req: AuthRequest, res: Response) => {
  const { status } = req.body;
  await db.run("UPDATE job_applications SET status=?, updated_at=datetime('now') WHERE id=?", [status, req.params.appId]);
  res.json({ message: 'Status updated' });
});

router.get('/', async (req: AuthRequest, res: Response) => {
  const { search, category, location, job_type, page = '1', limit = '10' } = req.query;
  const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
  let where = 'WHERE j.is_active = 1';
  const args: any[] = [];
  if (search) { where += ' AND (j.title LIKE ? OR j.description LIKE ? OR j.company LIKE ?)'; args.push(`%${search}%`,`%${search}%`,`%${search}%`); }
  if (category && category !== 'All') { where += ' AND j.category = ?'; args.push(category); }
  if (location) { where += ' AND j.location LIKE ?'; args.push(`%${location}%`); }
  if (job_type && job_type !== 'All') { where += ' AND j.job_type = ?'; args.push(job_type); }

  const jobs = await db.query(
    `SELECT j.*, u.name as recruiter_name, u.avatar as recruiter_avatar, u.company_name FROM jobs j JOIN users u ON j.recruiter_id = u.id ${where} ORDER BY j.is_promoted DESC, j.created_at DESC LIMIT ? OFFSET ?`,
    [...args, parseInt(limit as string), offset]
  );
  const countRes = await db.get(`SELECT COUNT(*) as count FROM jobs j ${where}`, args);
  res.json({ jobs, total: countRes?.count || 0, page: parseInt(page as string) });
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  const job = await db.get(`SELECT j.*, u.name as recruiter_name, u.avatar as recruiter_avatar, u.email as recruiter_email, u.phone as recruiter_phone, u.company_name, u.company_description
    FROM jobs j JOIN users u ON j.recruiter_id = u.id WHERE j.id = ? AND j.is_active = 1`, [req.params.id]);
  if (!job) return res.status(404).json({ error: 'Not found' });
  await db.run('UPDATE jobs SET views = views + 1 WHERE id = ?', [req.params.id]);
  res.json(job);
});

router.post('/', authenticate, requireRole('recruiter'), async (req: AuthRequest, res: Response) => {
  const { title, description, requirements, location, salary_min, salary_max, currency, job_type, category } = req.body;
  if (!title || !description || !location || !job_type || !category) return res.status(400).json({ error: 'Missing fields' });
  const recruiter = await db.get('SELECT company_name FROM users WHERE id = ?', [req.userId]);
  const id = uuidv4();
  await db.run(`INSERT INTO jobs (id,recruiter_id,title,company,description,requirements,location,salary_min,salary_max,currency,job_type,category) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    [id, req.userId, title, recruiter?.company_name||'Company', description, requirements||'', location, salary_min||null, salary_max||null, currency||'MMK', job_type, category]);
  res.status(201).json({ id, message: 'Job posted' });
});

router.put('/:id', authenticate, requireRole('recruiter'), async (req: AuthRequest, res: Response) => {
  const job = await db.get('SELECT id FROM jobs WHERE id = ? AND recruiter_id = ?', [req.params.id, req.userId]);
  if (!job) return res.status(404).json({ error: 'Not found' });
  const { title, description, requirements, location, salary_min, salary_max, currency, job_type, category, is_active } = req.body;
  await db.run(`UPDATE jobs SET title=COALESCE(?,title),description=COALESCE(?,description),requirements=COALESCE(?,requirements),location=COALESCE(?,location),salary_min=COALESCE(?,salary_min),salary_max=COALESCE(?,salary_max),currency=COALESCE(?,currency),job_type=COALESCE(?,job_type),category=COALESCE(?,category),is_active=COALESCE(?,is_active),updated_at=datetime('now') WHERE id=?`,
    [title||null,description||null,requirements||null,location||null,salary_min??null,salary_max??null,currency||null,job_type||null,category||null,is_active??null,req.params.id]);
  res.json({ message: 'Updated' });
});

router.delete('/:id', authenticate, requireRole('recruiter'), async (req: AuthRequest, res: Response) => {
  const r = await db.run('DELETE FROM jobs WHERE id = ? AND recruiter_id = ?', [req.params.id, req.userId]);
  if (!r.changes) return res.status(404).json({ error: 'Not found' });
  res.json({ message: 'Deleted' });
});

router.post('/:id/apply', authenticate, requireRole('job_seeker'), async (req: AuthRequest, res: Response) => {
  const job = await db.get('SELECT id FROM jobs WHERE id = ? AND is_active = 1', [req.params.id]);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  const existing = await db.get('SELECT id FROM job_applications WHERE job_id = ? AND applicant_id = ?', [req.params.id, req.userId]);
  if (existing) return res.status(409).json({ error: 'Already applied' });
  await db.run('INSERT INTO job_applications (id,job_id,applicant_id,cover_letter) VALUES (?,?,?,?)',
    [uuidv4(), req.params.id, req.userId, req.body.cover_letter||null]);
  res.status(201).json({ message: 'Applied' });
});

router.get('/:id/applications', authenticate, requireRole('recruiter'), async (req: AuthRequest, res: Response) => {
  const job = await db.get('SELECT id FROM jobs WHERE id = ? AND recruiter_id = ?', [req.params.id, req.userId]);
  if (!job) return res.status(404).json({ error: 'Not found' });
  const apps = await db.query(`SELECT ja.*, u.name, u.email, u.phone, u.education, u.experience, u.skills, u.avatar
    FROM job_applications ja JOIN users u ON ja.applicant_id = u.id WHERE ja.job_id = ? ORDER BY ja.created_at DESC`, [req.params.id]);
  apps.forEach((a: any) => a.skills = JSON.parse(a.skills||'[]'));
  res.json(apps);
});

router.post('/:id/save', authenticate, async (req: AuthRequest, res: Response) => {
  const existing = await db.get('SELECT * FROM saved_jobs WHERE user_id = ? AND job_id = ?', [req.userId, req.params.id]);
  if (existing) {
    await db.run('DELETE FROM saved_jobs WHERE user_id = ? AND job_id = ?', [req.userId, req.params.id]);
    res.json({ saved: false });
  } else {
    await db.run('INSERT INTO saved_jobs (user_id,job_id) VALUES (?,?)', [req.userId, req.params.id]);
    res.json({ saved: true });
  }
});

export default router;
