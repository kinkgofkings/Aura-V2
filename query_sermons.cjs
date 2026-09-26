const Database = require('better-sqlite3');
const db = new Database('./data/bible/bible_study.db');
const rows = db.prepare('SELECT * FROM sermons_podcasts').all();
console.log(rows);
