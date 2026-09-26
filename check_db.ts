import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'bible', 'bible_study.db');
const db = new Database(dbPath);

const courses = db.prepare("SELECT title, coverImage FROM courses").all() as any[];
for (const c of courses) {
    console.log(`${c.title} - Has Cover: ${!!c.coverImage}`);
}

console.log('--- Lessons ---');
const lessons = db.prepare("SELECT c.title as courseTitle, COUNT(l.id) as count FROM courses c LEFT JOIN lessons l ON c.id = l.courseId GROUP BY c.id").all() as any[];
for (const l of lessons) {
    console.log(`${l.courseTitle} - Lessons: ${l.count}`);
}

