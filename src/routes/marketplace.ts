import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/my/listings', authenticate, async (req: AuthRequest, res: Response) => {
  const listings = await db.query('SELECT * FROM marketplace_listings WHERE seller_id = ? ORDER BY created_at DESC', [req.userId]);
  listings.forEach((l: any) => l.images = JSON.parse(l.images||'[]'));
  res.json(listings);
});

router.get('/', async (req: AuthRequest, res: Response) => {
  const { search, category, location, page = '1', limit = '20' } = req.query;
  const offset = (parseInt(page as string)-1)*parseInt(limit as string);
  let where = 'WHERE m.is_active = 1';
  const args: any[] = [];
  if (search) { where += ' AND (m.title LIKE ? OR m.description LIKE ?)'; args.push(`%${search}%`,`%${search}%`); }
  if (category && category !== 'All') { where += ' AND m.category = ?'; args.push(category); }
  if (location) { where += ' AND m.location LIKE ?'; args.push(`%${location}%`); }
  const listings = await db.query(
    `SELECT m.*, u.name as seller_name, u.avatar as seller_avatar FROM marketplace_listings m JOIN users u ON m.seller_id = u.id ${where} ORDER BY m.is_promoted DESC, m.created_at DESC LIMIT ? OFFSET ?`,
    [...args, parseInt(limit as string), offset]
  );
  listings.forEach((l: any) => l.images = JSON.parse(l.images||'[]'));
  const countRes = await db.get(`SELECT COUNT(*) as count FROM marketplace_listings m ${where}`, args);
  res.json({ listings, total: countRes?.count||0 });
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  const listing = await db.get(`SELECT m.*, u.name as seller_name, u.avatar as seller_avatar, u.phone as seller_phone, u.email as seller_email
    FROM marketplace_listings m JOIN users u ON m.seller_id = u.id WHERE m.id = ? AND m.is_active = 1`, [req.params.id]);
  if (!listing) return res.status(404).json({ error: 'Not found' });
  listing.images = JSON.parse(listing.images||'[]');
  await db.run('UPDATE marketplace_listings SET views = views + 1 WHERE id = ?', [req.params.id]);
  res.json(listing);
});

router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  const { title, description, price, currency, category, condition, location, images, phone } = req.body;
  if (!title||!description||!price||!category||!location) return res.status(400).json({ error: 'Missing fields' });
  const id = uuidv4();
  await db.run(`INSERT INTO marketplace_listings (id,seller_id,title,description,price,currency,category,condition,location,images,phone) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    [id, req.userId, title, description, price, currency||'MMK', category, condition||'new', location, JSON.stringify(images||[]), phone||null]);
  res.status(201).json({ id, message: 'Created' });
});

router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const l = await db.get('SELECT id FROM marketplace_listings WHERE id = ? AND seller_id = ?', [req.params.id, req.userId]);
  if (!l) return res.status(404).json({ error: 'Not found' });
  const { title, description, price, currency, category, condition, location, images, phone, is_active } = req.body;
  await db.run(`UPDATE marketplace_listings SET title=COALESCE(?,title),description=COALESCE(?,description),price=COALESCE(?,price),currency=COALESCE(?,currency),category=COALESCE(?,category),condition=COALESCE(?,condition),location=COALESCE(?,location),images=COALESCE(?,images),phone=COALESCE(?,phone),is_active=COALESCE(?,is_active),updated_at=datetime('now') WHERE id=?`,
    [title||null,description||null,price??null,currency||null,category||null,condition||null,location||null,images?JSON.stringify(images):null,phone||null,is_active??null,req.params.id]);
  res.json({ message: 'Updated' });
});

router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const r = await db.run('DELETE FROM marketplace_listings WHERE id = ? AND seller_id = ?', [req.params.id, req.userId]);
  if (!r.changes) return res.status(404).json({ error: 'Not found' });
  res.json({ message: 'Deleted' });
});

export default router;
