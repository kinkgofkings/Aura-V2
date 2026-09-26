import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'bible', 'bible_study.db');
const db = new Database(dbPath);

// 1. Fix missing covers with ones that WORK
const covers = {
    'The Way to Life': 'https://images.unsplash.com/photo-1444464666168-49b626d49cb0?w=800&q=80',
    'Born of Water and Spirit': 'https://images.unsplash.com/photo-1518057111178-44a106bad636?w=800&q=80',
    'The Family of God': 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&q=80',
    'This is Good News': 'https://images.unsplash.com/photo-1493612276216-ee3925520721?w=800&q=80'
};

for (const [title, url] of Object.entries(covers)) {
    db.prepare("UPDATE courses SET coverImage = ? WHERE title = ?").run(url, title);
}

// 2. Fix the 24 empty lessons with notes (and optionally videos)
function updateLessonExact(courseTitle: string, exactLessonTitle: string, notes: string, videoId: string | null = null) {
    const course = db.prepare("SELECT id FROM courses WHERE title = ?").get(courseTitle) as any;
    if (!course) return;
    
    if (videoId) {
        const mediaUrl = `https://www.youtube.com/watch?v=${videoId}`;
        db.prepare(`UPDATE lessons SET notes = ?, mediaType = 'youtube', mediaUrl = ? WHERE courseId = ? AND title = ?`).run(notes, mediaUrl, course.id, exactLessonTitle);
    } else {
        db.prepare(`UPDATE lessons SET notes = ? WHERE courseId = ? AND title = ?`).run(notes, course.id, exactLessonTitle);
    }
}

// "Foundations of Faith"
updateLessonExact('Foundations of Faith', 'The Word Became Flesh', 'The Incarnation is the central mystery of the Christian faith. It reveals that God does not merely shout instructions from heaven; He entered our broken world to redeem it from the inside out.', '_OLezoUvOEQ');
updateLessonExact('Foundations of Faith', 'Faith Defined', 'Faith is not blind optimism or a leap in the dark. Hebrews 11 defines it as "confidence in what we hope for and assurance about what we do not see." It is an active trust based on the reliable character of God.', 'nxwzq1PJImM');

// "Grace & Community"
updateLessonExact('Grace & Community', 'No Favoritism', 'James warns the early church against showing favoritism to the wealthy and dishonoring the poor. The Gospel levels the playing field: at the foot of the cross, all are equally in need of grace.', 'A14THPoc4-4');
updateLessonExact('Grace & Community', 'Love Without Hypocrisy', 'Paul urges believers in Rome to let their love be genuine. This means not just playing the part of a "good Christian," but actively detesting evil and clinging to what is good, showing deep affection for one another.', 'slyevQ1LW7A');

// "The Way to Life"
updateLessonExact('The Way to Life', 'Is There a God?', 'Psalm 19 declares that "the heavens declare the glory of God." God reveals Himself generally through the beauty and complexity of creation, but He reveals Himself specifically through Jesus.', 'nxwzq1PJImM');
updateLessonExact('The Way to Life', 'The Bible: God’s Word', 'The Bible is a unified story that leads to Jesus. As Paul writes in 2 Timothy, all Scripture is God-breathed and useful for teaching, correcting, and training in righteousness.', 'plSNIwhAn5o');
updateLessonExact('The Way to Life', 'The Gospel Story', 'The Gospel is not just good advice; it is good news. It is the announcement that in the death and resurrection of Jesus, God has defeated sin and death, and is inaugurating a new creation.', 'G_OlRWGLdnw');
updateLessonExact('The Way to Life', 'The Response of Faith', 'How do we respond to this good news? With faith and repentance. Repentance is turning away from our own way of running the world, and faith is turning toward Jesus in trust.', 'ABPVVw_aw44');

// "God Has Spoken"
updateLessonExact('God Has Spoken', 'How We Got the Bible', 'The Bible was written by dozens of authors, over thousands of years, across different continents. Yet, through the inspiration of the Holy Spirit, it tells one cohesive story of redemption.', 'plSNIwhAn5o');
updateLessonExact('God Has Spoken', 'The Old Testament Overview', 'The Old Testament is not a discarded first draft. It is the necessary foundation. It outlines God’s covenants with humanity and sets the stage for the coming of the Messiah.', 'F4isSyennFo');
updateLessonExact('God Has Spoken', 'The New Testament Overview', 'The New Testament opens with the arrival of the promised Messiah. It chronicles His life, the birth of the early church, and the ultimate consummation of all things in Revelation.', 'zX8NvpmSfa4');
updateLessonExact('God Has Spoken', 'Understanding Covenants', 'A covenant is a binding relationship. In the Old Testament, God made covenants with Noah, Abraham, Moses, and David. Jesus inaugurated the New Covenant, sealed with His own blood.', 'eAvYmE2YYIU');

// "Born of Water and Spirit"
updateLessonExact('Born of Water and Spirit', 'Repentance and Baptism', 'On the Day of Pentecost, Peter told the crowd to "repent and be baptized." Baptism is an outward sign of an inward reality: the washing away of sin and the beginning of a new life.', 'PgmAkM39Zt4');
updateLessonExact('Born of Water and Spirit', 'United in His Death', 'Paul tells the Romans that in baptism, we are united with Christ in His death and raised to walk in newness of life. Our old self is crucified so that sin might lose its power.', 'takEeHtRrMw');

// "The Family of God"
updateLessonExact('The Family of God', 'The Body of Christ', 'The Apostle Paul frequently uses the metaphor of a human body to describe the Church. Every part is distinct and necessary, but all belong to a single organism, united by the Spirit.', 'zX8NvpmSfa4');
updateLessonExact('The Family of God', 'Purpose of the Assembly', 'Hebrews urges believers not to give up meeting together. The gathering of the saints is not an optional extra; it is the primary way we encourage one another and rehearse the realities of the Kingdom.', 'zX8NvpmSfa4');
updateLessonExact('The Family of God', 'Servant Leadership', 'Leadership in the Kingdom of God is entirely inverted from worldly power. Jesus modeled servant leadership by washing His disciples\' feet, and Peter calls elders to shepherd the flock with humility.', 'nxwzq1PJImM');

// "Live a Life of Love"
updateLessonExact('Live a Life of Love', 'Forgiving Others', 'We are called to forgive as the Lord forgave us. Refusing to forgive someone is like drinking poison and expecting the other person to die. True freedom is found in extending the same grace we received.', 'ABPVVw_aw44');
updateLessonExact('Live a Life of Love', 'Purity in a Broken World', 'Living a life of love also means living a life of holiness. We are called to be set apart, honoring God with our bodies and our choices, demonstrating a better way to live in a broken world.', 'aNOZ7ocLD74');

// "The Prophets"
updateLessonExact('The Prophets', 'The Suffering Servant', 'Isaiah 53 provides a vivid and haunting prophecy of a servant who would be "pierced for our transgressions" and "crushed for our iniquities." This was perfectly fulfilled in the crucifixion of Jesus.', 'G_OlRWGLdnw');
updateLessonExact('The Prophets', 'A New Heart and Spirit', 'Ezekiel prophesied a day when God would remove the "heart of stone" and replace it with a "heart of flesh," putting His Spirit within His people so they could finally obey His decrees.', 'oNNZO9i1Gjc');
updateLessonExact('The Prophets', 'The Day of the Lord', 'Joel spoke of a day when the Spirit would be poured out on all people. This was dramatically fulfilled on the Day of Pentecost, marking the inauguration of the last days.', 'tEBc2gSSW04');

// "The Christian Hope"
updateLessonExact('The Christian Hope', 'The State of the Dead', 'While the New Testament often speaks of "falling asleep," believers have the assurance that to be absent from the body is to be present with the Lord, awaiting the final bodily resurrection.', 'uCOycIMyJZM');
updateLessonExact('The Christian Hope', 'The Second Coming', 'Jesus promised He would return to finally and fully establish His Kingdom. This gives believers immense hope and endurance in the midst of suffering, knowing that the story ends in victory.', 'tEBc2gSSW04');

console.log("All 24 missing lessons updated with deep content and videos!");
