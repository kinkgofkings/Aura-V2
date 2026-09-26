import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'bible', 'bible_study.db');
const db = new Database(dbPath);

// Generic cover images
const covers = {
    'Foundations of Faith': 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=800&q=80',
    'Grace & Community': 'https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=800&q=80',
    'Walking in Wisdom': 'https://images.unsplash.com/photo-1518991669955-9c7e78ec80ca?w=800&q=80',
    'The Way to Life': 'https://images.unsplash.com/photo-1473621038935-7fb5566f12de?w=800&q=80',
    'God Has Spoken': 'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=800&q=80',
    'Born of Water and Spirit': 'https://images.unsplash.com/photo-1438012940875-4f38eb488427?w=800&q=80',
    'The Family of God': 'https://images.unsplash.com/photo-1529156069898-49953eb1b5ae?w=800&q=80',
    'Live a Life of Love': 'https://images.unsplash.com/photo-1469598614039-ccfeb0a21111?w=800&q=80',
    'The Prophets': 'https://images.unsplash.com/photo-1494548162494-384bba4ab999?w=800&q=80',
    'The Christian Hope': 'https://images.unsplash.com/photo-1436891620584-47fd0e565afb?w=800&q=80'
};

for (const [title, url] of Object.entries(covers)) {
    db.prepare("UPDATE courses SET coverImage = ? WHERE title = ?").run(url, title);
}

console.log("Updated generic cover images.");
