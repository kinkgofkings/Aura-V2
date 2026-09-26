import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'bible', 'bible_study.db');
const db = new Database(dbPath);

// ----------------------------------------------------------------------
// UPDATE "Knowing Jesus"
// ----------------------------------------------------------------------
const jesusCourse = db.prepare("SELECT id FROM courses WHERE title = 'Knowing Jesus'").get() as any;
if (jesusCourse) {
  const cid = jesusCourse.id;

  const n1 = `The word "Incarnation" comes from the Latin "in carne," meaning "in the flesh." John 1 tells us that the Word (Logos)—who was eternally with God, and who *was* God—became human and made His dwelling among us. 

This shatters ancient Greek philosophy, which viewed the material world as evil or inferior. By becoming human, God validated physical existence. The Creator entered His own creation. He didn't just beam a message down; He became the message. 

When John says Jesus "made his dwelling" among us, the Greek word literally means he "tabernacled" or "pitched his tent." Jesus is the ultimate fulfillment of the Old Testament Tabernacle—the exact place where Heaven and Earth perfectly overlap and God's glory is revealed.`;
  db.prepare(`UPDATE lessons SET notes = ?, mediaType = 'youtube', mediaUrl = 'https://www.youtube.com/watch?v=G-2e9mMf7E8' WHERE courseId = ? AND title LIKE '%Incarnation%'`).run(n1, cid);

  const n2 = `When Jesus performed miracles, they were not just random displays of power to impress crowds. In the Gospels, miracles are often called "signs." A sign points to something beyond itself.

Jesus' miracles were visible proof that the Kingdom of God was breaking into the present world. 
- When He healed the sick, He was reversing the curse of the Fall.
- When He fed the 5,000, He was showing Himself as the true Provider (the new Moses giving bread from heaven).
- When He commanded the wind and waves (Mark 4), He was exercising authority that the Old Testament reserves strictly for Yahweh alone (Psalm 89, 107).

Every miracle was a preview of the New Creation—a world where sickness, hunger, chaos, and death are finally eradicated.`;
  db.prepare(`UPDATE lessons SET notes = ?, mediaType = 'youtube', mediaUrl = 'https://www.youtube.com/watch?v=26z_KsHHiKI' WHERE courseId = ? AND title LIKE '%Miracles%'`).run(n2, cid);

  const n3 = `The Sermon on the Mount (Matthew 5-7) is the greatest moral discourse ever given. But it is deeply misunderstood if read merely as a new set of rules to earn God's favor.

Jesus delivers this sermon from a mountainside, intentionally mirroring Moses delivering the Law from Mount Sinai. But Jesus doesn't just pass along God's Law; He *authoritatively interprets and fulfills it* ("You have heard it said... but I tell you").

The Beatitudes ("Blessed are the poor in spirit...") flip the world's value system upside down. In Jesus' Kingdom, the marginalized, the peacemakers, and the merciful are the true inheritors of the earth. Jesus is not giving a checklist for how to become righteous, but painting a picture of what a heart totally transformed by God actually looks like.`;
  db.prepare(`UPDATE lessons SET notes = ?, mediaType = 'youtube', mediaUrl = 'https://www.youtube.com/watch?v=3Dv4-n6OYGI' WHERE courseId = ? AND title LIKE '%Sermon%'`).run(n3, cid);

  const n4 = `In the Gospel of John, Jesus makes seven profound "I AM" statements (I am the Bread of Life, the Light of the World, the Good Shepherd, etc.). 

But the most explosive claim happens in John 8:58. The religious leaders challenge His authority, and Jesus replies: *"Before Abraham was born, I am!"*

He did not say "I was." He used the eternal present tense—the exact phrasing God used to identify Himself to Moses at the burning bush in Exodus 3:14 ("I AM WHO I AM"). 

The Pharisees immediately picked up stones to kill Him for blasphemy. They understood exactly what He was claiming. Jesus was taking the divine name of Yahweh, the uncreated Creator of the universe, and applying it directly to Himself.`;
  db.prepare(`UPDATE lessons SET notes = ?, mediaType = 'youtube', mediaUrl = 'https://www.youtube.com/watch?v=RUfh_wOsauk' WHERE courseId = ? AND title LIKE '%I AM%'`).run(n4, cid);
}


// ----------------------------------------------------------------------
// UPDATE "This is Good News"
// ----------------------------------------------------------------------
const gospelCourse = db.prepare("SELECT id FROM courses WHERE title = 'This is Good News'").get() as any;
if (gospelCourse) {
  const cid = gospelCourse.id;

  const n1 = `The biblical word for sin (khata in Hebrew, hamartia in Greek) is an archery term meaning "to miss the mark." But it's more than just breaking a rule; it is a fundamental fracturing of relationships—with God, with others, and with ourselves.

Sin entered humanity in Genesis 3 when humans decided they wanted to define good and evil on their own terms rather than trusting God. The result wasn't just bad behavior, but a terminal spiritual disease. 

Romans 3:23 states clearly that "all have sinned and fall short of the glory of God." This means no amount of human effort, moral living, or religious observance can bridge the gap back to a perfectly holy Creator. The diagnosis is fatal.`;
  db.prepare(`UPDATE lessons SET notes = ?, mediaType = 'youtube', mediaUrl = 'https://www.youtube.com/watch?v=aOsEioAaFJU' WHERE courseId = ? AND title LIKE '%Problem of Sin%'`).run(n1, cid);

  const n2 = `Because God is perfectly just, He cannot simply ignore evil and sin. Justice demands that wrongs be made right. In the Old Testament, the sacrificial system taught the people a harsh but vital truth: the penalty for sin is death, and blood must be shed for atonement (covering).

But the blood of bulls and goats could never permanently take away human sin (Hebrews 10). They were placeholders. 

Jesus stepped into history as the ultimate fulfillment of this system. He lived the perfect life we failed to live, and He died the death that we deserved to die. On the cross, a great exchange took place: He took our sin and its penalty, and offered us His perfect righteousness in return. The debt has been paid in full (Tetelestai).`;
  db.prepare(`UPDATE lessons SET notes = ?, mediaType = 'youtube', mediaUrl = 'https://www.youtube.com/watch?v=G_OlRWGLdnw' WHERE courseId = ? AND title LIKE '%Price Paid%'`).run(n2, cid);

  const n3 = `If justice is getting what you deserve, and mercy is *not* getting what you deserve, then grace is getting what you *do not* deserve. 

Ephesians 2:8-9 is the bedrock of the Gospel: "For it is by grace you have been saved, through faith—and this is not from yourselves, it is the gift of God—not by works, so that no one can boast."

Every other world religion operates on a system of "Do" (do these things, and you might reach God). Christianity operates entirely on "Done" (Christ has done the work, you simply receive the gift). Grace destroys human pride because you cannot earn it, and it destroys despair because you cannot out-sin it if you truly turn to Him.`;
  db.prepare(`UPDATE lessons SET notes = ?, mediaType = 'youtube', mediaUrl = 'https://www.youtube.com/watch?v=WbxtxnFh0X8' WHERE courseId = ? AND title LIKE '%Grace%'`).run(n3, cid);

  const n4 = `Salvation is not just a "get out of hell free" card. It is a radical transformation of your very nature. 

When Paul writes in 2 Corinthians 5:17 that anyone in Christ is a "new creation," he is using cosmic language. The same God who said "Let there be light" in Genesis 1 speaks light into the dead human heart. 

You do not merely get a clean slate; you get the indwelling Holy Spirit. The old, sin-enslaved self is crucified with Christ, and a new self, empowered to love God and love others, is resurrected. You are no longer defined by your past failures, but by your new identity in Christ.`;
  db.prepare(`UPDATE lessons SET notes = ?, mediaType = 'youtube', mediaUrl = 'https://www.youtube.com/watch?v=t5JmCfa3Pcw' WHERE courseId = ? AND title LIKE '%New Creation%'`).run(n4, cid);
}

console.log("Updated Knowing Jesus & This is Good News");
