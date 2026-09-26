import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'bible', 'bible_study.db');
const db = new Database(dbPath);

const lessons = db.prepare(`
    SELECT c.title as courseTitle, l.id, l.title, l.notes, l.mediaUrl 
    FROM lessons l 
    JOIN courses c ON l.courseId = c.id
`).all() as any[];

console.log("\n--- LESSONS WITH MISSING NOTES/VIDEO ---");
for (const l of lessons) {
    if (!l.notes || !l.mediaUrl) {
        console.log(`Course: ${l.courseTitle} | Lesson: ${l.title} | HasNotes: ${!!l.notes} | HasMedia: ${!!l.mediaUrl}`);
    }
}
