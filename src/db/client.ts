import path from 'node:path';
import fs from 'node:fs';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

const DATA_DIR = process.env.DATA_DIR || path.join(/* turbopackIgnore: true */ process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const DB_PATH = path.join(DATA_DIR, 'workout.sqlite');

const sqlite = new Database(DB_PATH);
// DELETE (not WAL) - WAL's shared-memory (-shm) file needs mmap-based locking that
// doesn't work over Docker Desktop's bind-mount file sharing (Windows/NAS via
// SMB/NFS), causing SQLITE_IOERR_SHMOPEN. Single-user app, so WAL's concurrent
// reader benefit isn't needed.
sqlite.pragma('journal_mode = DELETE');
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema });
export { sqlite };
