import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'bible', 'bible_study.db');
const db = new Database(dbPath);

// Function to safely update a lesson based on partial title match within a course
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
// 1. Fix "Understanding the Old Testament"
// ----------------------------------------------------------------------
updateLesson('Understanding the Old Testament', 'Abraham', 
    `The story of Abraham is the hinge of the entire Bible. After the catastrophic failure of humanity in Genesis 1-11 (Eden, the Flood, Babel), God pivots from dealing with all nations to focusing on one man: Abram. 

In Genesis 12, God makes a unilateral, unconditional covenant. He promises Abraham three things:
1. **Land**: A place to dwell (Canaan).
2. **Seed (Descendants)**: A great nation.
3. **Blessing**: Through Abraham, *all families of the earth* will be blessed.

This final promise is the Gospel in advance.`, 'F4isSyennFo');

updateLesson('Understanding the Old Testament', 'Deliverance', 
    `The Exodus is the defining salvation event of the Old Testament. The descendants of Abraham have become a massive nation, but they are enslaved in Egypt. God raises up Moses not just as a political liberator, but as a mediator.

The Ten Plagues were not random magic tricks; they were systematic defeats of the Egyptian pantheon, proving that Yahweh alone is Sovereign. After crossing the Red Sea, God brings them to Mount Sinai to establish a covenant.`, 'jH_aojNJM3E');

updateLesson('Understanding the Old Testament', 'Kings', 
    `Israel was uniquely designed to be a theocracy (ruled by God), but looking at the surrounding nations, they demanded a human king. God permits this, warning them of the consequences. 

After Saul's tragic failure, God anoints David—a man after His own heart. God makes a stunning covenant with David in 2 Samuel 7: **A descendant of David will sit on the throne forever.** This is the foundation for the Messiah.`, 'bVFW3wbi9pk');

updateLesson('Understanding the Old Testament', 'Exile', 
    `The exile was not an accident; it was the ultimate covenant curse outlined back in Deuteronomy. Because of centuries of idolatry and injustice, God allowed the Babylonians to destroy Jerusalem and the Temple in 586 BC.

But God is faithful. He promised through the prophet Jeremiah that the exile would last 70 years, followed by a restoration. In the books of Ezra and Nehemiah, they return to rebuild, but the prophetic promises of a glorious, world-ruling Messiah have not yet materialized.`, 'XzWpa0gcPyo');


// ----------------------------------------------------------------------
// 2. Fix "Knowing Jesus"
// ----------------------------------------------------------------------
updateLesson('Knowing Jesus', 'Incarnation', 
    `The word "Incarnation" comes from the Latin "in carne," meaning "in the flesh." John 1 tells us that the Word (Logos)—who was eternally with God, and who *was* God—became human and made His dwelling among us. 

By becoming human, God validated physical existence. The Creator entered His own creation. He didn't just beam a message down; He became the message.`, '_OLezoUvOEQ');

updateLesson('Knowing Jesus', 'Miracles', 
    `When Jesus performed miracles, they were not just random displays of power to impress crowds. In the Gospels, miracles are often called "signs." A sign points to something beyond itself.

Jesus' miracles were visible proof that the Kingdom of God was breaking into the present world. When He healed the sick, He was reversing the curse of the Fall. Every miracle was a preview of the New Creation.`, 'cBxOZqtGTXE');

updateLesson('Knowing Jesus', 'Sermon', 
    `The Sermon on the Mount (Matthew 5-7) is the greatest moral discourse ever given. But it is deeply misunderstood if read merely as a new set of rules to earn God's favor.

Jesus delivers this sermon from a mountainside, intentionally mirroring Moses delivering the Law from Mount Sinai. But Jesus doesn't just pass along God's Law; He *authoritatively interprets and fulfills it*.`, 'NtKb7CJDUZc');

updateLesson('Knowing Jesus', 'I AM', 
    `In the Gospel of John, Jesus makes seven profound "I AM" statements (I am the Bread of Life, the Light of the World, the Good Shepherd, etc.). 

But the most explosive claim happens in John 8:58. The religious leaders challenge His authority, and Jesus replies: *"Before Abraham was born, I am!"* He was taking the divine name of Yahweh, the uncreated Creator, and applying it directly to Himself.`, 'eAvYmE2YYIU');


// ----------------------------------------------------------------------
// 3. Fix "This is Good News"
// ----------------------------------------------------------------------
updateLesson('This is Good News', 'Problem of Sin', 
    `The biblical word for sin (khata in Hebrew, hamartia in Greek) is an archery term meaning "to miss the mark." But it's more than just breaking a rule; it is a fundamental fracturing of relationships.

Sin entered humanity in Genesis 3 when humans decided they wanted to define good and evil on their own terms. The result wasn't just bad behavior, but a terminal spiritual disease.`, 'aNOZ7ocLD74');

updateLesson('This is Good News', 'Price Paid', 
    `Because God is perfectly just, He cannot simply ignore evil and sin. Justice demands that wrongs be made right. In the Old Testament, the sacrificial system taught the people a harsh but vital truth.

Jesus stepped into history as the ultimate fulfillment of this system. He lived the perfect life we failed to live, and He died the death that we deserved to die.`, 'G_OlRWGLdnw');

updateLesson('This is Good News', 'Grace', 
    `If justice is getting what you deserve, and mercy is *not* getting what you deserve, then grace is getting what you *do not* deserve. 

Every other world religion operates on a system of "Do" (do these things, and you might reach God). Christianity operates entirely on "Done" (Christ has done the work, you simply receive the gift).`, 'ABPVVw_aw44');

updateLesson('This is Good News', 'New Creation', 
    `Salvation is not just a "get out of hell free" card. It is a radical transformation of your very nature. 

When Paul writes in 2 Corinthians 5:17 that anyone in Christ is a "new creation," he is using cosmic language. The same God who said "Let there be light" in Genesis 1 speaks light into the dead human heart.`, 'takEeHtRrMw');


console.log("Updated Core Courses with REAL videos.");
