import Database from 'better-sqlite3';
import path from 'path';

let instance: Database.Database | null = null;

export function db(): Database.Database {
  if (!instance) {
    const dbPath = process.env.DB_PATH || './fofa.db';
    instance = new Database(path.resolve(dbPath));
    instance.pragma('journal_mode = WAL');
    instance.pragma('foreign_keys = ON');
  }
  return instance;
}

export function closeDb(): void {
  if (instance) {
    instance.close();
    instance = null;
  }
}
