import path from 'node:path';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db, sqlite } from './client';
import { seedIfEmpty } from './seed';

migrate(db, { migrationsFolder: path.join(__dirname, '..', '..', 'drizzle') });
seedIfEmpty(db);
sqlite.close();
console.log('Migrations applied.');
