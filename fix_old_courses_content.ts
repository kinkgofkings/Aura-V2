import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'bible', 'bible_study.db');
const db = new Database(dbPath);

function updateLesson(courseTitle: string, titleMatch: string, notes: string, videoId: string | null) {
    const course = db.prepare("SELECT id FROM courses WHERE title = ?").get(courseTitle) as any;
    if (!course) return;
    
    if (videoId) {
        const mediaUrl = `https://www.youtube.com/watch?v=${videoId}`;
        db.prepare(`UPDATE lessons SET notes = ?, mediaType = 'youtube', mediaUrl = ? WHERE courseId = ? AND title LIKE ?`).run(notes, mediaUrl, course.id, `%${titleMatch}%`);
    } else {
        db.prepare(`UPDATE lessons SET notes = ? WHERE courseId = ? AND title LIKE ?`).run(notes, course.id, `%${titleMatch}%`);
    }
}

// "Foundations of Faith"
updateLesson('Foundations of Faith', 'God', 'God is the creator of the universe, and He is a deeply personal being who desires a relationship with humanity.', 'nxwzq1PJImM');
updateLesson('Foundations of Faith', 'Jesus', 'Jesus is the cornerstone of the Christian faith. He is fully God and fully man, reconciling humanity to God.', '_OLezoUvOEQ');

// "Grace & Community"
updateLesson('Grace & Community', 'Grace', 'Grace is unmerited favor. It is the defining characteristic of the Gospel.', 'ABPVVw_aw44');
updateLesson('Grace & Community', 'Community', 'We are not meant to walk the Christian life alone. Community is essential for growth and accountability.', 'zX8NvpmSfa4');

// "Walking in Wisdom"
updateLesson('Walking in Wisdom', 'Trust', 'Wisdom begins with the fear of the Lord. Proverbs teaches us that trusting God is the foundation of a wise life.', 'plSNIwhAn5o');
updateLesson('Walking in Wisdom', 'Asking', 'James tells us that if any of us lacks wisdom, we should ask God, who gives generously to all without finding fault.', 'tEBc2gSSW04');

console.log("Updated older courses with videos too.");
