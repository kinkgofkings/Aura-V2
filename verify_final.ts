import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'bible', 'bible_study.db');
const db = new Database(dbPath);

const lessons = db.prepare(`
    SELECT c.title as courseTitle, l.id, l.title, l.notes, l.mediaUrl 
    FROM lessons l 
    JOIN courses c ON l.courseId = c.id
`).all() as any[];

let badLessons = 0;
for (const l of lessons) {
    if (!l.notes || !l.mediaUrl) {
        console.log(`Course: ${l.courseTitle} | Lesson: ${l.title} | HasNotes: ${!!l.notes} | HasMedia: ${!!l.mediaUrl}`);
        badLessons++;
    }
}

if (badLessons === 0) {
    console.log("ALL lessons have notes and media URLs!");
} else {
    console.log(`${badLessons} lessons are still incomplete.`);
}

const courses = db.prepare("SELECT title, coverImage FROM courses").all() as any[];
let badCourses = 0;
for (const c of courses) {
    if (!c.coverImage || c.coverImage.includes('unsplash.com/photo-1444464') || c.coverImage.includes('unsplash.com/photo-1544427') || c.coverImage.includes('unsplash.com/photo-1529156') || c.coverImage.includes('unsplash.com/photo-1438012') || c.coverImage.includes('unsplash.com/photo-1473621') ) {
        console.log(`Course ${c.title} has a broken image: ${c.coverImage}`);
        badCourses++;
    }
}
if (badCourses === 0) {
    console.log("ALL courses have working covers!");
}

