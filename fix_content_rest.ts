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

// ----------------------------------------------------------------------
// 4. The Way to Life
// ----------------------------------------------------------------------
updateLesson('The Way to Life', 'God is Love', 
    `To say "God is Love" (1 John 4:8) means that love is not just something God does, but who He fundamentally is. 

Before the universe was created, the Father, Son, and Holy Spirit existed in a perfect, eternal community of love. When God created humanity, He was inviting us into that exact same circle of love.`, 'nxwzq1PJImM');

updateLesson('The Way to Life', 'Who is Jesus', 
    `Jesus is not just a moral teacher; He is the exact representation of God's being (Hebrews 1). 

If you want to know what God looks like, look at Jesus. He is the Creator stepping into the created world to rescue it from the inside out.`, '_OLezoUvOEQ');


// ----------------------------------------------------------------------
// 5. God Has Spoken (How to Read the Bible)
// ----------------------------------------------------------------------
updateLesson('God Has Spoken', 'Word', 
    `The Bible is a unified story that leads to Jesus. It is a collection of ancient books produced over thousands of years, yet it tells one brilliant, cohesive narrative. 

Reading the Bible isn't about finding out-of-context quotes for inspiration, but learning to read it as ancient Jewish meditation literature.`, 'plSNIwhAn5o');


// ----------------------------------------------------------------------
// 6. Born of Water and Spirit
// ----------------------------------------------------------------------
updateLesson('Born of Water and Spirit', 'New Birth', 
    `In John 3, Jesus tells Nicodemus he must be "born of water and the Spirit." Water has always represented cleansing and new life in the Bible, going all the way back to Genesis 1 where the Spirit hovered over the waters.`, 'PgmAkM39Zt4');

updateLesson('Born of Water and Spirit', 'Holy Spirit', 
    `The Holy Spirit is not an impersonal force; He is the personal presence of God living inside of you. 

In the Old Testament, the Spirit would temporarily empower individuals for specific tasks. But under the New Covenant, the Spirit is poured out on *all* believers, permanently dwelling in them to transform their character and empower them for witness.`, 'oNNZO9i1Gjc');


// ----------------------------------------------------------------------
// 7. The Family of God
// ----------------------------------------------------------------------
updateLesson('The Family of God', 'Church', 
    `The Church is not a building or a weekly event. The biblical word "ekklesia" means a gathered assembly. 

The Church is the living, breathing body of Christ on Earth. We are meant to be a preview of the coming Kingdom of God, showing the world what it looks like when Jesus is King.`, 'zX8NvpmSfa4');


// ----------------------------------------------------------------------
// 8. Live a Life of Love
// ----------------------------------------------------------------------
updateLesson('Live a Life of Love', 'Greatest Commandment', 
    `When asked what the greatest commandment is, Jesus famously said: "Love the Lord your God with all your heart, soul, and mind, and love your neighbor as yourself."

Biblical love (Agape) is not a feeling. It is a choice to seek the ultimate well-being of another person, regardless of their response.`, 'slyevQ1LW7A');

updateLesson('Live a Life of Love', 'Light', 
    `Walking in the light means living a life of transparency, integrity, and active justice. God is a God of justice, which means making wrong things right. As followers of Jesus, we are called to actively pursue justice for the vulnerable.`, 'A14THPoc4-4');


// ----------------------------------------------------------------------
// 9. The Prophets
// ----------------------------------------------------------------------
updateLesson('The Prophets', 'Prophet', 
    `The Old Testament prophets were not fortune-tellers predicting the distant future. They were covenant watchdogs. 

Their primary job was to call Israel out on their idolatry and their injustice toward the poor, and warn them of the coming consequences (the Day of the Lord).`, 'edcqUu_BtN0');


// ----------------------------------------------------------------------
// 10. The Christian Hope
// ----------------------------------------------------------------------
updateLesson('The Christian Hope', 'New Heavens', 
    `The biblical hope is not escaping Earth to go float on clouds in a disembodied heaven. 

The Christian hope is the *resurrection of the body* and the renewal of creation. Revelation 21 shows Heaven coming *down* to Earth to unite them forever. Jesus' resurrection was the firstfruits of this new physical, incorruptible reality.`, 'uCOycIMyJZM');

updateLesson('The Christian Hope', 'Judgment', 
    `The Day of the Lord is a common prophetic theme. It is the day when God will finally intervene in human history to permanently eradicate evil, injustice, and death. 

While it is a day of judgment against human rebellion, it is a day of ultimate salvation for those who trust in Christ.`, 'tEBc2gSSW04');

console.log("Updated remaining courses with REAL videos.");
