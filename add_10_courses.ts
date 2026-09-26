import Database from 'better-sqlite3';
import path from 'path';
import crypto from 'crypto';

const dbPath = path.join(process.cwd(), 'data', 'bible', 'bible_study.db');
const db = new Database(dbPath);

const newCourses = [
    {
        title: "Torah Series",
        description: "Explore the first five books of the Bible and see how they set up the entire biblical story.",
        coverImage: "https://images.unsplash.com/photo-1519001308365-1823ed68b31d?w=800&q=80",
        lessons: [
            { title: "Genesis 1-11", notes: "The first part of Genesis shows how God creates a good world, but humanity introduces sin and rebellion.", video: "KOUV7mWDI34" },
            { title: "Genesis 12-50", notes: "God chooses Abraham and his family to rescue the world from the consequences of sin and bless all nations.", video: "F4isSyennFo" },
            { title: "Exodus 1-18", notes: "God rescues the Israelites from slavery in Egypt, confronting Pharaoh and establishing a new covenant.", video: "jH_aojNJM3E" },
            { title: "Leviticus", notes: "Despite their rebellion, God provides a way for the Israelites to live near His holy presence through the sacrificial system.", video: "IJ-FekWUZzE" },
            { title: "Numbers", notes: "The Israelites journey through the wilderness to the promised land, repeatedly rebelling against God.", video: "tp5MIrMZFqo" }
        ]
    },
    {
        title: "Wisdom Series",
        description: "Discover what it means to live well in God's good but deeply flawed world through Proverbs, Ecclesiastes, and Job.",
        coverImage: "https://images.unsplash.com/photo-1505664177922-2418fc373b9e?w=800&q=80",
        lessons: [
            { title: "Proverbs", notes: "Proverbs invites us to live by God's wisdom, showing that the 'fear of the Lord' is the beginning of understanding.", video: "Gab04dPs_uA" },
            { title: "Ecclesiastes", notes: "The Teacher explores the unpredictable nature of life (hevel) and concludes that we should enjoy God's gifts while fearing Him.", video: "lrsQ1tc-2wk" },
            { title: "Job", notes: "Job explores the profound question of why God allows suffering and how we are to trust Him when the world seems unjust.", video: "xQwnH8th_fs" }
        ]
    },
    {
        title: "Gospel of Matthew",
        description: "See how Jesus is presented as the promised Messiah from the line of David, who brings the Kingdom of God.",
        coverImage: "https://images.unsplash.com/photo-1493612276216-ee3925520721?w=800&q=80",
        lessons: [
            { title: "Matthew 1-13", notes: "Jesus arrives as the Messiah, announces the Kingdom, and teaches the Sermon on the Mount.", video: "3Dv4-n6OYGI" },
            { title: "Matthew 14-28", notes: "Jesus clashes with Israel's leaders, goes to the cross, and rises from the dead to launch the great commission.", video: "G-2e9mMf7E8" }
        ]
    },
    {
        title: "Gospel of Luke",
        description: "Luke shows how Jesus' story fulfills the story of God and Israel, bringing salvation to the whole world.",
        coverImage: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&q=80",
        lessons: [
            { title: "Luke 1-9", notes: "Jesus launches His ministry of healing, Jubilee, and announcing God's upside-down Kingdom.", video: "XIb_dCXNi5s" },
            { title: "Luke 10-24", notes: "Jesus journeys to Jerusalem, where He gives His life as a sacrifice and rises in victory.", video: "26z_KjsR4B0" }
        ]
    },
    {
        title: "The Letters of Paul",
        description: "Explore the profound theology and practical teachings of the Apostle Paul to the early churches.",
        coverImage: "https://images.unsplash.com/photo-1455849318743-b2233052fcff?w=800&q=80",
        lessons: [
            { title: "Romans 1-4", notes: "Paul explains that the Gospel is God's power to save people of every nation and create a unified family of faith.", video: "ej_6dVdJSIU" },
            { title: "Ephesians", notes: "Discover how the Gospel reconciles us to God and to one another, forming a new humanity.", video: "Y71r-T98E2Q" },
            { title: "Philippians", notes: "Paul writes from prison, urging believers to adopt the mindset of Christ through humble service.", video: "oE9qqW1-BkU" },
            { title: "Colossians", notes: "Jesus is the supreme ruler of the universe, and we are called to live our lives rooted in Him.", video: "pXTXlDxQsvc" }
        ]
    },
    {
        title: "The Holy Spirit",
        description: "Understand the person and work of the Holy Spirit throughout the biblical story.",
        coverImage: "https://images.unsplash.com/photo-1518057111178-44a106bad636?w=800&q=80",
        lessons: [
            { title: "The Spirit of God", notes: "From the beginning, the ruakh (Spirit/Breath) of God is the personal, empowering presence of the Creator.", video: "oNNZO9i1Gjc" },
            { title: "Pentecost", notes: "The Spirit is poured out on all believers, fulfilling the prophetic promises and empowering the Church.", video: "ZUlBq_iYdEE" },
            { title: "Fruit of the Spirit", notes: "The Spirit transforms our character from the inside out, producing love, joy, peace, patience, kindness, goodness, faithfulness, gentleness, and self-control.", video: "g_igCcWAMAM" }
        ]
    },
    {
        title: "Spiritual Beings",
        description: "Dive into the unseen realm of angels, demons, and the divine council in the biblical worldview.",
        coverImage: "https://images.unsplash.com/photo-1478147427282-58a87a120781?w=800&q=80",
        lessons: [
            { title: "The Divine Council", notes: "God rules the universe alongside a host of spiritual beings who participate in His governance.", video: "e1ZIqZxlFQU" },
            { title: "Angels and Cherubim", notes: "These beings serve as messengers and guardians of God's holy space.", video: "-bMRxQbNDig" },
            { title: "The Satan and Demons", notes: "Rebellious spiritual beings who seek to deceive humanity and disrupt God's good creation.", video: "CAMYFqqqk-Q" }
        ]
    },
    {
        title: "Character of God",
        description: "Examine Exodus 34:6-7, the most quoted verse in the Bible by the Bible itself, to understand God's true nature.",
        coverImage: "https://images.unsplash.com/photo-1469598614039-ccfeb0a21111?w=800&q=80",
        lessons: [
            { title: "Compassionate and Gracious", notes: "God feels deep empathy for human suffering and responds with unmerited favor.", video: "j-JmB9-yvEI" },
            { title: "Slow to Anger", notes: "God is incredibly patient, giving humanity time to repent and change.", video: "TeQxVqERXqk" },
            { title: "Loyal Love and Faithfulness", notes: "God's 'hesed' (loyal love) is the bedrock of His covenantal commitment to His people.", video: "2L2P7D6Z3Kk" }
        ]
    },
    {
        title: "How to Read the Bible",
        description: "Learn essential skills and paradigms for reading the biblical texts as a unified story.",
        coverImage: "https://images.unsplash.com/photo-1494548162494-384bba4ab999?w=800&q=80",
        lessons: [
            { title: "What is the Bible?", notes: "The Bible is a small library of books that emerged from the history of the people of ancient Israel.", video: "ak06MSETeo4" },
            { title: "The Story of the Bible", notes: "The whole Bible traces one cohesive narrative from creation, to the fall, to redemption in Jesus.", video: "7_CGP-12AE0" },
            { title: "Literary Styles", notes: "Understanding the difference between narrative, poetry, and prose discourse is crucial for interpreting the Bible.", video: "oUXJ8Owes8E" }
        ]
    },
    {
        title: "The Revelation",
        description: "Unpack the complex apocalyptic imagery of Revelation to find its profound message of hope.",
        coverImage: "https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=800&q=80",
        lessons: [
            { title: "Revelation 1-11", notes: "John receives a vision of Jesus leading His church through suffering toward ultimate victory.", video: "5nvVVcYD-0w" },
            { title: "Revelation 12-22", notes: "The final defeat of evil and the arrival of the New Heavens and New Earth, where God dwells with humanity.", video: "QpnIrbq2bKo" }
        ]
    }
];

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
    
    for (const lesson of course.lessons) {
        const lessonExisting = db.prepare("SELECT id FROM lessons WHERE courseId = ? AND title = ?").get(courseId, lesson.title);
        const mediaUrl = `https://www.youtube.com/watch?v=${lesson.video}`;
        if (!lessonExisting) {
            db.prepare(`
                INSERT INTO lessons (id, courseId, title, notes, mediaType, mediaUrl, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, 'youtube', ?, datetime('now'), datetime('now'))
            `).run(crypto.randomUUID(), courseId, lesson.title, lesson.notes, mediaUrl);
        } else {
            db.prepare("UPDATE lessons SET notes = ?, mediaType = 'youtube', mediaUrl = ? WHERE id = ?").run(lesson.notes, mediaUrl, (lessonExisting as any).id);
        }
    }
}
console.log("Successfully added 10 new Bible Project courses!");

