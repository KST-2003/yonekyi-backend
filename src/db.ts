import { createClient, Client, ResultSet } from '@libsql/client';
import path from 'path';
import fs from 'fs';

const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const DB_URL = process.env.DATABASE_URL || `file:${path.join(dataDir, 'yonekyi.db')}`;

export const client: Client = createClient({ url: DB_URL });

// Sync-style wrapper so routes don't need to change
// @libsql/client is async - we wrap in a tiny sync-compatible interface
class SyncDb {
  private _client: Client;

  constructor(c: Client) { this._client = c; }

  // Execute and return rows synchronously via promise stored on object
  // Routes must use await db.query() / db.run() / db.exec()
  async query(sql: string, args: any[] = []): Promise<any[]> {
    const res = await this._client.execute({ sql, args });
    return res.rows as any[];
  }

  async run(sql: string, args: any[] = []): Promise<{ changes: number; lastInsertRowid: number }> {
    const res = await this._client.execute({ sql, args });
    return { changes: res.rowsAffected, lastInsertRowid: Number(res.lastInsertRowid ?? 0) };
  }

  async exec(sql: string): Promise<void> {
    // Split on ; and run each statement
    const stmts = sql.split(';').map(s => s.trim()).filter(Boolean);
    for (const stmt of stmts) {
      await this._client.execute(stmt);
    }
  }

  async get(sql: string, args: any[] = []): Promise<any | null> {
    const rows = await this.query(sql, args);
    return rows[0] ?? null;
  }
}

export const db = new SyncDb(client);

export async function initDb(): Promise<void> {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      avatar TEXT,
      phone TEXT,
      address TEXT,
      birthday TEXT,
      education TEXT,
      experience TEXT,
      skills TEXT DEFAULT '[]',
      bio TEXT,
      company_name TEXT,
      company_description TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      recruiter_id TEXT NOT NULL,
      title TEXT NOT NULL,
      company TEXT NOT NULL,
      description TEXT NOT NULL,
      requirements TEXT NOT NULL,
      location TEXT NOT NULL,
      salary_min INTEGER,
      salary_max INTEGER,
      currency TEXT DEFAULT 'MMK',
      job_type TEXT NOT NULL,
      category TEXT NOT NULL,
      is_promoted INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      views INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS job_applications (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL,
      applicant_id TEXT NOT NULL,
      cover_letter TEXT,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE(job_id, applicant_id)
    );
    CREATE TABLE IF NOT EXISTS marketplace_listings (
      id TEXT PRIMARY KEY,
      seller_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      price INTEGER NOT NULL,
      currency TEXT DEFAULT 'MMK',
      category TEXT NOT NULL,
      condition TEXT DEFAULT 'new',
      location TEXT NOT NULL,
      images TEXT DEFAULT '[]',
      phone TEXT,
      is_active INTEGER DEFAULT 1,
      is_promoted INTEGER DEFAULT 0,
      views INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS matchmaking_profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      age INTEGER,
      gender TEXT,
      bio TEXT,
      interests TEXT DEFAULT '[]',
      preferred_area TEXT,
      preferred_age_min INTEGER DEFAULT 18,
      preferred_age_max INTEGER DEFAULT 60,
      preferred_education TEXT,
      preferred_work_field TEXT,
      is_active INTEGER DEFAULT 1,
      boost_until TEXT,
      photos TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS match_actions (
      id TEXT PRIMARY KEY,
      from_user_id TEXT NOT NULL,
      to_user_id TEXT NOT NULL,
      action TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(from_user_id, to_user_id)
    );
    CREATE TABLE IF NOT EXISTS matches (
      id TEXT PRIMARY KEY,
      user1_id TEXT NOT NULL,
      user2_id TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      match_id TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      reviewer_id TEXT NOT NULL,
      reviewed_id TEXT NOT NULL,
      rating INTEGER NOT NULL,
      comment TEXT,
      context TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS saved_jobs (
      user_id TEXT NOT NULL,
      job_id TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (user_id, job_id)
    )
  `);
  console.log('✅ Database initialized');
}

export default db;
