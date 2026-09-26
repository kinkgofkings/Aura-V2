import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'bible', 'bible_study.db');
const db = new Database(dbPath);

const url = 'https://images.unsplash.com/photo-1478147427282-58a87a120781?w=800&q=80';
db.prepare("UPDATE courses SET coverImage = ? WHERE title = ?").run(url, 'The Way to Life');

console.log("Fixed 'The Way to Life' cover!");
