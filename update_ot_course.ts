import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'bible', 'bible_study.db');
const db = new Database(dbPath);

// 1. Fix Cover Image
const newCover = 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800&auto=format&fit=crop';
db.prepare("UPDATE courses SET coverImage = ? WHERE title = 'Understanding the Old Testament'").run(newCover);

const courseIdRow = db.prepare("SELECT id FROM courses WHERE title = 'Understanding the Old Testament'").get() as any;
if (courseIdRow) {
  const courseId = courseIdRow.id;
  console.log('Course ID:', courseId);

  // Lesson 1: The Promises to Abraham
  const notes1 = `The story of Abraham is the hinge of the entire Bible. After the catastrophic failure of humanity in Genesis 1-11 (Eden, the Flood, Babel), God pivots from dealing with all nations to focusing on one man: Abram. 

In Genesis 12, God makes a unilateral, unconditional covenant. He promises Abraham three things:
1. **Land**: A place to dwell (Canaan).
2. **Seed (Descendants)**: A great nation, despite Sarah being barren.
3. **Blessing**: Through Abraham, *all families of the earth* will be blessed.

This final promise is the Gospel in advance. It sets the stage for the rest of Scripture. God's plan isn't just to save a single tribe, but to use that tribe as a rescue vehicle to redeem the entire world. When we read the rest of the Old Testament, we are watching this exact promise unfold through Isaac, Jacob, the 12 Tribes, and ultimately, Jesus Christ.`;
  
  db.prepare(`UPDATE lessons SET notes = ?, mediaType = 'youtube', mediaUrl = 'https://www.youtube.com/watch?v=F4isSyennFc' WHERE courseId = ? AND title LIKE '%Abraham%'`).run(notes1, courseId);

  // Lesson 2: Deliverance and Law
  const notes2 = `The Exodus is the defining salvation event of the Old Testament. The descendants of Abraham have become a massive nation, but they are enslaved in Egypt. God raises up Moses not just as a political liberator, but as a mediator.

The Ten Plagues were not random magic tricks; they were systematic defeats of the Egyptian pantheon (the gods of the Nile, frogs, sun, etc.), proving that Yahweh alone is Sovereign. 

After crossing the Red Sea, God brings them to Mount Sinai to establish a covenant. The Law (Torah) was not given so they could *earn* salvation. They were already saved! The Law was given to show a redeemed people how to live as a "kingdom of priests" and a "holy nation" representing God to the surrounding world. 

The Tabernacle (the tent of meeting) was the climax of Exodus. It was a portable Garden of Eden, a place where God's holy presence could dwell safely among a flawed people through the system of sacrificial atonement.`;

  db.prepare(`UPDATE lessons SET notes = ?, mediaType = 'youtube', mediaUrl = 'https://www.youtube.com/watch?v=0uf-PgW7rqE' WHERE courseId = ? AND title LIKE '%Deliverance%'`).run(notes2, courseId);

  // Lesson 3: Kings and Kingdoms
  const notes3 = `Israel was uniquely designed to be a theocracy (ruled by God), but looking at the surrounding nations, they demanded a human king. God permits this, warning them of the consequences. 

After Saul's tragic failure, God anoints David—a man after His own heart. David isn't perfect (his failure with Bathsheba is catastrophic), but he is repentant. God makes a stunning covenant with David in 2 Samuel 7: **A descendant of David will sit on the throne forever.**

This royal promise is the foundation for the "Messiah" (the Anointed One). David's son, Solomon, builds a glorious permanent Temple, centralizing worship in Jerusalem. But his reign ends in compromise, marrying foreign women and worshipping their idols. 

This triggers the devastating division of the kingdom: Israel in the North (which immediately falls into idolatry) and Judah in the South (which struggles to remain faithful). The story of the kings is a downward spiral showing that humanity needs a better King than David or Solomon.`;

  db.prepare(`UPDATE lessons SET notes = ?, mediaType = 'youtube', mediaUrl = 'https://www.youtube.com/watch?v=QJOju5Dw0V0' WHERE courseId = ? AND title LIKE '%Kings%'`).run(notes3, courseId);

  // Lesson 4: Exile and Return
  const notes4 = `The exile was not an accident; it was the ultimate covenant curse outlined back in Deuteronomy. Because of centuries of idolatry and injustice, God allowed the Babylonians (under Nebuchadnezzar) to destroy Jerusalem and the Temple in 586 BC, carrying the best of Judah into captivity.

But God is faithful. He promised through the prophet Jeremiah that the exile would last 70 years, followed by a restoration.

In the books of Ezra and Nehemiah, the Persian King Cyrus shockingly decrees that the Jews can return home. They return in waves:
- **Zerubbabel** rebuilds the Temple (though it is a shadow of Solomon's glory).
- **Ezra** brings spiritual reform and restores the Torah.
- **Nehemiah** rebuilds the walls of Jerusalem.

However, the Old Testament ends on a strange, anti-climactic note. They are back in the land, but they are still ruled by foreign empires. The prophetic promises of a glorious, world-ruling Messiah and a new heart (the New Covenant) have not yet materialized. They are waiting. This sets the perfect stage for the opening pages of the New Testament.`;

  db.prepare(`UPDATE lessons SET notes = ?, mediaType = 'youtube', mediaUrl = 'https://www.youtube.com/watch?v=MkETkRv9tG8' WHERE courseId = ? AND title LIKE '%Exile%'`).run(notes4, courseId);
}

console.log("Updated Understanding the Old Testament");
