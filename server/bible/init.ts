/**
 * Initialize Bible Study Database
 */

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { BibleStudyDB } from './models';
import { seedBibleCourses } from './seed';

export function initializeBibleDB(dbPath: string): Database.Database {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new Database(dbPath);
  
  // Resolve schema relative to server/bible or fallback to data/bible
  let schemaPath = path.join(process.cwd(), 'server', 'bible', 'schema.sql');
  if (!fs.existsSync(schemaPath)) {
    schemaPath = path.join(process.cwd(), 'data', 'bible', 'schema.sql');
  }
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  
  db.exec(schema);

  // Ensure new columns exist
  try {
    const tableInfo = db.pragma('table_info(lessons)') as Array<{ name: string }>;
    const names = tableInfo.map((c) => c.name);
    if (!names.includes('videoPosition')) {
      db.prepare("ALTER TABLE lessons ADD COLUMN videoPosition TEXT DEFAULT 'top'").run();
    }
    if (!names.includes('images')) {
      db.prepare("ALTER TABLE lessons ADD COLUMN images TEXT").run();
    }
  } catch (e) {
    console.warn('[BibleDB] Migration warning:', e);
  }
  
  const bibleDB = new BibleStudyDB(dbPath);
  seedBibleCourses(bibleDB);
  
  return db;
}
