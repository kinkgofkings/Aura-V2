import Database from 'better-sqlite3';
import path from 'path';
import crypto from 'crypto';

const dbPath = path.join(process.cwd(), 'data', 'bible', 'bible_study.db');
const db = new Database(dbPath);

const newCourses = [
    {
        title: "The Bible Unpacked - Foundations",
        description: "A foundational study of the Bible's core teachings, based on The Bible Unpacked series. Freely reproduced for non-commercial Christian purposes.",
        coverImage: "https://images.unsplash.com/photo-1544427920-c49ccca8a056?w=800&q=80",
        lessons: [
            { title: "Study A - God and Spiritual Powers", url: "https://www.thebibleunpacked.net/studies/TBU_Foundations_Study_A.pdf" },
            { title: "Study B - God and the World", url: "https://www.thebibleunpacked.net/studies/TBU_Foundations_Study_B.pdf" },
            { title: "Study C - Jesus Christ", url: "https://www.thebibleunpacked.net/studies/TBU_Foundations_Study_C.pdf" },
            { title: "Study D - God's Grace", url: "https://www.thebibleunpacked.net/studies/TBU_Foundations_Study_D.pdf" },
            { title: "Study E - Believers and God", url: "https://www.thebibleunpacked.net/studies/TBU_Foundations_Study_E.pdf" },
            { title: "Study F - Believers and Fellow Believers", url: "https://www.thebibleunpacked.net/studies/TBU_Foundations_Study_F.pdf" },
            { title: "Study G - Believers and the World", url: "https://www.thebibleunpacked.net/studies/TBU_Foundations_Study_G.pdf" },
            { title: "Study H - Church and Future", url: "https://www.thebibleunpacked.net/studies/TBU_Foundations_Study_H.pdf" }
        ]
    },
    {
        title: "The Bible Unpacked - Intermediate",
        description: "An intermediate study diving deeper into biblical themes and doctrines, based on The Bible Unpacked series.",
        coverImage: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=80",
        lessons: [
            { title: "Study A - God and Spiritual Powers", url: "https://www.thebibleunpacked.net/studies/TBU_Intermediate_Study_A.pdf" },
            { title: "Study B - God and the World", url: "https://www.thebibleunpacked.net/studies/TBU_Intermediate_Study_B.pdf" },
            { title: "Study C - Jesus Christ", url: "https://www.thebibleunpacked.net/studies/TBU_Intermediate_Study_C.pdf" },
            { title: "Study D - God's Grace", url: "https://www.thebibleunpacked.net/studies/TBU_Intermediate_Study_D.pdf" },
            { title: "Study E - Believers and God", url: "https://www.thebibleunpacked.net/studies/TBU_Intermediate_Study_E.pdf" },
            { title: "Study F - Believers and Fellow Believers", url: "https://www.thebibleunpacked.net/studies/TBU_Intermediate_Study_F.pdf" },
            { title: "Study G - Believers and the World", url: "https://www.thebibleunpacked.net/studies/TBU_Intermediate_Study_G.pdf" },
            { title: "Study H - Church and Future", url: "https://www.thebibleunpacked.net/studies/TBU_Intermediate_Study_H.pdf" }
        ]
    }
];

// Ensure no broken images are used, we can use verified working Unsplash ones from earlier.
const covers = [
    'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=800&q=80',
    'https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=800&q=80'
];
newCourses[0].coverImage = covers[0];
newCourses[1].coverImage = covers[1];

for (const course of newCourses) {
    const existing = db.prepare("SELECT id FROM courses WHERE title = ?").get(course.title);
    let courseId;
    if (!existing) {
        const result = db.prepare(`
            INSERT INTO courses (id, title, description, coverImage, createdAt, updatedAt) 
            VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
        `).run(crypto.randomUUID(), course.title, course.description, course.coverImage);
        
        courseId = db.prepare("SELECT id FROM courses WHERE title = ?").get(course.title).id;
        console.log(`Added course: ${course.title}`);
    } else {
        courseId = (existing as any).id;
        db.prepare("UPDATE courses SET description = ?, coverImage = ? WHERE id = ?").run(course.description, course.coverImage, courseId);
    }
    
    let orderIndex = 1;
    for (const lesson of course.lessons) {
        const lessonExisting = db.prepare("SELECT id FROM lessons WHERE courseId = ? AND title = ?").get(courseId, lesson.title);
        // Note: we use mediaType = 'pdf'
        if (!lessonExisting) {
            db.prepare(`
                INSERT INTO lessons (id, courseId, title, mediaType, mediaUrl, order_index, createdAt, updatedAt)
                VALUES (?, ?, ?, 'pdf', ?, ?, datetime('now'), datetime('now'))
            `).run(crypto.randomUUID(), courseId, lesson.title, lesson.url, orderIndex);
        } else {
            db.prepare("UPDATE lessons SET mediaType = 'pdf', mediaUrl = ?, order_index = ? WHERE id = ?").run(lesson.url, orderIndex, (lessonExisting as any).id);
        }
        orderIndex++;
    }
}
console.log("Successfully added The Bible Unpacked courses!");
