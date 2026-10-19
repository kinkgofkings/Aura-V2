/**
 * Default Courses & Lessons Catalog
 * Persisted in source code so that newly deployed servers, fresh containers,
 * or cloned environments automatically include user-crafted courses and curriculum.
 */

export interface StaticCourseData {
  id?: string;
  title: string;
  description: string;
  coverImage?: string;
  category?: string;
  level?: string;
}

export interface StaticLessonData {
  id?: string;
  courseTitle: string; // Used to map lesson to course
  title: string;
  content?: string;
  scriptureRef?: string;
  quizJson?: string;
  mediaType?: 'youtube' | 'upload' | 'pdf' | 'none';
  mediaUrl?: string;
  notes?: string;
  videoPosition?: 'top' | 'bottom';
  images?: string;
}

export const INITIAL_COURSES: StaticCourseData[] = [
  {
    id: '3d4f41ce-c076-4312-8337-3c7fa5ddce0a',
    title: 'The Triumph of Grace: A Complete Expository Course on Romans Chapter 8',
    description:
      'A structured 4-quarter course covering the bedrock chapter of Christian assurance, identity, and external security. Formatted for direct integration into your Aura Bible App.',
    coverImage: '/courses/romans8_triumph_of_grace.jpg',
    category: 'New Testament',
    level: 'Beginner',
  },
  {
    id: 'course-roman-road-salvation',
    title: 'The Roman Road to Salvation: The Gospel of Jesus Christ',
    description:
      'An interactive, foundational course walking through the Apostle Paul’s roadmap to eternal salvation, justification by faith, and new life in Christ Jesus.',
    coverImage: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=800&auto=format&fit=crop&q=80',
    category: 'Evangelism & Gospel',
    level: 'Beginner',
  },
  {
    id: 'course-ru-10-principles',
    title: 'Reformers Unanimous: 10 Spiritual Principles for Lifelong Victory',
    description:
      'The complete biblical curriculum from RU Recovery Ministry. Discover how Christ breaks every stronghold through truth, repentance, and the renewing of the mind.',
    coverImage: 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=800&auto=format&fit=crop&q=80',
    category: 'Christian Recovery',
    level: 'All Believers',
  },
  {
    id: 'course-armor-of-god',
    title: 'The Whole Armor of God: Victorious Spiritual Warfare',
    description:
      'An expository discipleship journey through Ephesians 6. Learn how to stand unshakeable against the enemy wearing the belt of truth, shield of faith, and sword of the Spirit.',
    coverImage: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=800&auto=format&fit=crop&q=80',
    category: 'Spiritual Warfare',
    level: 'Intermediate',
  },
  {
    id: 'b8737f72-4807-42fc-8bec-ad1973307de0',
    title: 'Foundations of Faith',
    description: 'Explore the core truths of Christian faith through Scripture',
    category: 'Theology',
    level: 'Beginner',
  },
  {
    id: '8c53203d-ec1c-4056-9487-1a2785af69a8',
    title: 'Walking in Wisdom',
    description: 'Practical wisdom for daily living from Scripture',
    category: 'Wisdom',
    level: 'Intermediate',
  },
  {
    id: '2af3bfe2-0572-430c-b34d-60d755683416',
    title: 'Grace & Community',
    description: 'Living out grace and building authentic Christian community',
    category: 'Discipleship',
    level: 'Beginner',
  },
];

export const INITIAL_LESSONS: StaticLessonData[] = [
  {
    id: 'd094f9f5-dfaa-4c4f-9b3e-86a49038ea13',
    courseTitle: 'The Triumph of Grace: A Complete Expository Course on Romans Chapter 8',
    title: 'The Triumph of Grace: A Complete Expository Course on Romans Chapter 8',
    scriptureRef: 'Romans 8:1-2',
    mediaType: 'youtube',
    mediaUrl: 'https://youtu.be/FL6XfIn_iLo?si=QBvOxY9UIKHxtXGc',
    videoPosition: 'bottom',
    notes: `The Verdict of Freedom — No Condemnation
"There is therefore now no condemnation to them which are in Christ Jesus, who walk not after the flesh, but after the Spirit. For the law of the Spirit of life in Christ Jesus hath made me free from the law of sin and death."
— Romans 8:1-2 (KJV)
View passage on Bible Gateway (KJV)`,
    content: `• 1.  Expository Study
   Chapter 8 opens with one of the most magnificent conjunctions in Scripture: "There is therefore now...". This links directly backward to the agonizing spiritual struggle of Romans 7, where the Apostle Paul lamented the perpetual war of human weakness against God's holy law. The answer to human failure is not self-reformation, but union with Christ. The forensic courtroom verdict handed down by the Almighty Judge is absolute: no condemnation. For those who belong to Jesus Christ, the penalty has been paid completely. Furthermore, Paul introduces the dynamic ruling principle—"the law of the Spirit of life"—which breaks the crushing stranglehold and tyranny of "the law of sin and death". God accomplished what human flesh utterly failed to do by sending His own Son in the likeness of sinful flesh as a sacrifice, fulfilling the righteous requirements of the law within those transformed by the Spirit.

• 2. Summary for Learning
   Core Theme: Justification brings an irreversible, permanent standing of absolute acquittal before God.
Key Contrast: The helpless weakness of human flesh versus the liberating, supernatural power of the Holy Spirit.
Divine Remedy: Christ's substitutionary sacrifice on the cross satisfies divine justice completely.

• 3. Time Period Breakdown
   First Century Context: Written around AD 57–58 from Corinth during Paul's third missionary journey, addressing a diverse church composed of Jewish and Gentile believers grappling with legalism, cultural friction, and the transition from Old Covenant Mosaic regulations to New Covenant liberty.

• 4. Audience Then and Now
Then: Roman believers under mounting societal pressure, some struggling with Jewish legalism (the idea that keeping rituals earned standing with God) and others struggling with guilt from past pagan lives.
Now: Modern believers battling chronic guilt, condemnation from past mistakes, and performance-based religious anxiety.

• 5. Comparison and Contrast
Under the Law vs. Under the Spirit: The Mosaic Law served as a mirror showing moral failure and pronouncing a righteous sentence of death upon rule-breakers (Romans 7). In sharp contrast, the Spirit of life acts as an inner transforming power, shifting the believer from legal liability to living adoption.

• 6. Life Application Then and Now
Then: Encouraged early Christians facing severe persecution to look past temporary earthly judgments and rest securely in God's eternal verdict of acquittal.
Now: Reminds believers today that God's grace is greater than any recurring failure or wave of self-condemnation, enabling a walk characterized by joyful obedience rather than fearful compliance.`,
  },
  {
    courseTitle: 'Foundations of Faith',
    title: 'The Word Became Flesh',
    content: 'Understanding the incarnation and divinity of Christ',
    scriptureRef: 'John 1:1',
    quizJson: JSON.stringify({
      questions: ['What does it mean that the Word was God?', 'How does this shape your faith?'],
    }),
  },
  {
    courseTitle: 'Foundations of Faith',
    title: 'Faith Defined',
    content: 'What is faith and why does it matter?',
    scriptureRef: 'Hebrews 11:1',
    quizJson: JSON.stringify({
      questions: ['How do you define faith?', 'What role does faith play in your life?'],
    }),
  },
  {
    courseTitle: 'Walking in Wisdom',
    title: 'Trust and Lean Not',
    content: 'Trusting God with your whole heart',
    scriptureRef: 'Proverbs 3:5-6',
    quizJson: JSON.stringify({
      questions: ['What does it mean to trust with your whole heart?', 'How can you apply this today?'],
    }),
  },
  {
    courseTitle: 'Walking in Wisdom',
    title: 'Asking for Wisdom',
    content: 'How to seek and receive wisdom from God',
    scriptureRef: 'James 1:5',
    quizJson: JSON.stringify({
      questions: ['When have you needed wisdom?', 'How do you ask God for guidance?'],
    }),
  },
  {
    courseTitle: 'Grace & Community',
    title: 'No Favoritism',
    content: 'Treating all people with equal dignity and respect',
    scriptureRef: 'James 2:1-4',
    quizJson: JSON.stringify({
      questions: ['How do you show favoritism?', 'What would it look like to treat everyone equally?'],
    }),
  },
  {
    courseTitle: 'Grace & Community',
    title: 'Love Without Hypocrisy',
    content: 'Genuine love and community in action',
    scriptureRef: 'Romans 12:9-13',
    quizJson: JSON.stringify({
      questions: ['What does genuine love look like?', 'How can you build community?'],
    }),
  },
  // --- The Roman Road to Salvation ---
  {
    courseTitle: 'The Roman Road to Salvation: The Gospel of Jesus Christ',
    title: 'Part 1: The Universal Condition — All Have Sinned',
    scriptureRef: 'Romans 3:23',
    mediaType: 'youtube',
    mediaUrl: 'https://www.youtube.com/watch?v=FL6XfIn_iLo',
    videoPosition: 'top',
    notes: `"For all have sinned, and come short of the glory of God;" — Romans 3:23 (KJV)
"As it is written, There is none righteous, no, not one:" — Romans 3:10 (KJV)`,
    content: `• 1. Expository Overview
The Apostle Paul establishes that every human being, regardless of religious background, moral upbringing, or social standing, stands guilty before a holy and righteous God. The Greek word for sin (hamartia) means "to miss the mark"—like an arrow falling short of a target. God’s standard is absolute perfection, and all mankind has fallen short. We cannot save ourselves through good works, church attendance, or ritual baptism. Recognition of our spiritual bankruptcy is the vital first step on the road to eternal life.

• 2. Life Application
Humility is the doorway to grace. We stop comparing our righteousness to other people and see ourselves honestly in the mirror of God’s holy law. 

• 3. Key Takeaway
No one is good enough to save themselves, and no one is too bad for God's saving grace.`,
    quizJson: JSON.stringify({
      questions: [
        'What does Romans 3:23 declare about the human condition?',
        'Why can human good works never earn salvation before a holy God?',
        'How does acknowledging our sin prepare our hearts to receive Christ?'
      ]
    }),
  },
  {
    courseTitle: 'The Roman Road to Salvation: The Gospel of Jesus Christ',
    title: 'Part 2: The Penalty vs. The Gift of God',
    scriptureRef: 'Romans 6:23',
    mediaType: 'youtube',
    mediaUrl: 'https://www.youtube.com/watch?v=FL6XfIn_iLo',
    videoPosition: 'top',
    notes: `"For the wages of sin is death; but the gift of God is eternal life through Jesus Christ our Lord." — Romans 6:23 (KJV)`,
    content: `• 1. Expository Overview
Paul contrasts two powerful concepts: wages vs. a gift. A wage is something you earn through labor; the righteous paycheck for our rebellion against God is spiritual death and eternal separation from Him. In sharp and glorious contrast, eternal life cannot be earned or bought; it is a free gift (charis) given by God through Jesus Christ our Lord.

• 2. Life Application
Salvation is a gift to be received by humble faith, not a prize to be earned by human pride. When someone offers you a gift, you simply receive it with thanksgiving.

• 3. Reflection
Rejoice today that Christ paid your infinite debt so that you might receive the free gift of everlasting life!`,
    quizJson: JSON.stringify({
      questions: [
        'What are the "wages of sin" according to Romans 6:23?',
        'How does a gift differ from a wage in biblical theology?',
        'Through whom alone is eternal life provided?'
      ]
    }),
  },
  {
    courseTitle: 'The Roman Road to Salvation: The Gospel of Jesus Christ',
    title: 'Part 3: God Commendeth His Love',
    scriptureRef: 'Romans 5:8',
    mediaType: 'youtube',
    mediaUrl: 'https://www.youtube.com/watch?v=FL6XfIn_iLo',
    videoPosition: 'top',
    notes: `"But God commendeth his love toward us, in that, while we were yet sinners, Christ died for us." — Romans 5:8 (KJV)`,
    content: `• 1. Expository Overview
Human love is conditional, often dependent on the attractiveness or goodness of the object. But divine agape love is unconditional and sacrificial. Christ did not wait for us to clean up our lives, reform our habits, or show moral promise. "While we were yet sinners," Jesus stepped into our place, took our punishment upon Calvary’s cross, and satisfied the full wrath of God against sin.

• 2. Assurance
God proved His love once and for all at Golgotha. Whenever Satan whispers that God doesn't care, look back at the cross of Jesus Christ!`,
    quizJson: JSON.stringify({
      questions: [
        'What does it mean that God "commendeth" His love toward us?',
        'What was our spiritual state when Christ died for us?',
        'How does Romans 5:8 silence religious doubt about God’s love?'
      ]
    }),
  },
  {
    courseTitle: 'The Roman Road to Salvation: The Gospel of Jesus Christ',
    title: 'Part 4: Confession, Belief & Calling on the Lord',
    scriptureRef: 'Romans 10:9-10, 13',
    mediaType: 'youtube',
    mediaUrl: 'https://www.youtube.com/watch?v=FL6XfIn_iLo',
    videoPosition: 'top',
    notes: `"That if thou shalt confess with thy mouth the Lord Jesus, and shalt believe in thine heart that God hath raised him from the dead, thou shalt be saved. For with the heart man believeth unto righteousness; and with the mouth confession is made unto salvation... For whosoever shall call upon the name of the Lord shall be saved." — Romans 10:9-10, 13 (KJV)`,
    content: `• 1. Expository Overview
How does an individual receive this salvation? Paul gives the clear biblical formula: heart belief in the bodily resurrection of Jesus Christ and verbal confession of Jesus as Lord. "Whosoever" includes you, your family, your neighbors, and anyone who turns to Christ in childlike trust.

• 2. The Sinner's Prayer & Faith
Salvation happens in an instant of saving faith. You can call upon the Lord right now: "Lord Jesus, I know I am a sinner. I believe You died for my sins and rose again. Right now, I turn from my sin and put my trust in You alone as my Savior. Thank You for saving me!"`,
    quizJson: JSON.stringify({
      questions: [
        'What two elements are highlighted in Romans 10:9-10 for salvation?',
        'What promise does Romans 10:13 make to "whosoever shall call"?',
        'Have you personally called upon Jesus Christ to be your Lord and Savior?'
      ]
    }),
  },
  // --- Reformers Unanimous: 10 Spiritual Principles ---
  {
    courseTitle: 'Reformers Unanimous: 10 Spiritual Principles for Lifelong Victory',
    title: 'Principle 1: If God Is Against It, So Am I',
    scriptureRef: '1 Thessalonians 5:22',
    mediaType: 'youtube',
    mediaUrl: 'https://www.youtube.com/watch?v=SHzFPyaewLA',
    videoPosition: 'top',
    notes: `"Abstain from all appearance of evil." — 1 Thessalonians 5:22 (KJV)`,
    content: `• 1. RU Principle Overview
True biblical recovery and spiritual freedom begins when our desires align with God's Word. If God hates a sin, we cannot entertain, flirt with, or make excuses for it. Freedom is not merely quitting a bad habit; it is developing a holy hatred for what destroys the soul and a deep love for righteousness.

• 2. Practical Application
Identify subtle compromises in media, friendships, or environments that keep you near temptation. Flee youthful lusts and pursue righteousness with them that call on the Lord out of a pure heart (2 Tim 2:22).`,
    quizJson: JSON.stringify({
      questions: [
        'Why must a believer adopt God’s stance toward sin rather than their own emotions?',
        'What does it mean to "abstain from all appearance of evil"?',
        'How does this principle safeguard a recovering heart?'
      ]
    }),
  },
  {
    courseTitle: 'Reformers Unanimous: 10 Spiritual Principles for Lifelong Victory',
    title: 'Principle 2: Every Sin Has Its Origin in Your Heart',
    scriptureRef: 'James 1:14-15',
    mediaType: 'youtube',
    mediaUrl: 'https://www.youtube.com/watch?v=MTzfz_MY7hM',
    videoPosition: 'top',
    notes: `"But every man is tempted, when he is drawn away of his own lust, and enticed. Then when lust hath conceived, it bringeth forth sin: and sin, when it is finished, bringeth forth death." — James 1:14-15 (KJV)`,
    content: `• 1. RU Principle Overview
We cannot blame circumstances, upbringing, trauma, or other people for our sinful choices. Temptation does not force us; it entices what is already in our flesh. When we take personal responsibility and guard the heart (Proverbs 4:23), the Holy Spirit can cleanse and transform our deepest desires.`,
    quizJson: JSON.stringify({
      questions: [
        'Where does temptation find traction according to James 1:14?',
        'Why is taking personal responsibility essential for spiritual victory?',
        'How does daily Scripture reading guard the heart?'
      ]
    }),
  },
  {
    courseTitle: 'Reformers Unanimous: 10 Spiritual Principles for Lifelong Victory',
    title: 'Principle 9: Freedom Lost Through Indulgence',
    scriptureRef: 'John 8:34-36',
    mediaType: 'youtube',
    mediaUrl: 'https://www.youtube.com/watch?v=rSUO3zTthzQ',
    videoPosition: 'top',
    notes: `"Jesus answered them, Verily, verily, I say unto you, Whosoever committeth sin is the servant of sin... If the Son therefore shall make you free, ye shall be free indeed." — John 8:34, 36 (KJV)`,
    content: `• 1. RU Principle Overview
You always choose your actions, but you cannot choose the consequences. When a person yields to temptation, they surrender their freedom and become enslaved to their appetite. Only Jesus Christ possesses the power to break the shackles of addiction, habitual sin, and spiritual defeat.`,
    quizJson: JSON.stringify({
      questions: [
        'How does sin enslave the person who yields to it?',
        'What is Christ’s promise in John 8:36 for the believer in recovery?',
        'What practical steps do you take when feeling the pull of an old habit?'
      ]
    }),
  },
  // --- The Whole Armor of God ---
  {
    courseTitle: 'The Whole Armor of God: Victorious Spiritual Warfare',
    title: 'Part 1: The Armor of God & Belt of Truth',
    scriptureRef: 'Ephesians 6:10-14',
    mediaType: 'youtube',
    mediaUrl: 'https://www.youtube.com/watch?v=FL6XfIn_iLo',
    videoPosition: 'top',
    notes: `"Finally, my brethren, be strong in the Lord, and in the power of his might. Put on the whole armour of God, that ye may be able to stand against the wiles of the devil." — Ephesians 6:10-11 (KJV)`,
    content: `• 1. Expository Overview
The Christian life is not a playground; it is a battleground. Paul warns that our wrestle is not against flesh and blood, but against spiritual wickedness in high places. The Roman soldier's leather belt (balteus) held every other piece of armor in place and gathered his garments for action. In the Christian life, truth—both God's objective truth in Scripture and our personal integrity—is the foundation of every spiritual victory.`,
    quizJson: JSON.stringify({
      questions: [
        'Against whom is the believer’s real warfare according to Ephesians 6:12?',
        'Why is truth represented as the foundational belt holding the armor together?',
        'How do we combat Satan’s lies using Scripture?'
      ]
    }),
  },
  {
    courseTitle: 'The Whole Armor of God: Victorious Spiritual Warfare',
    title: 'Part 2: The Shield of Faith & Sword of the Spirit',
    scriptureRef: 'Ephesians 6:16-18',
    mediaType: 'youtube',
    mediaUrl: 'https://www.youtube.com/watch?v=FL6XfIn_iLo',
    videoPosition: 'top',
    notes: `"Above all, taking the shield of faith, wherewith ye shall be able to quench all the fiery darts of the wicked. And take the helmet of salvation, and the sword of the Spirit, which is the word of God:" — Ephesians 6:16-17 (KJV)`,
    content: `• 1. Expository Overview
The Roman scutum was a large four-foot door-like shield covered in leather soaked in water to extinguish burning pitch arrows. Faith in God’s promises extinguishes every fiery arrow of doubt, accusation, and lust fired by the enemy. Furthermore, the Sword of the Spirit (the Word of God) is our only offensive weapon. When Jesus was tempted in the wilderness, He wielded this very sword, quoting "It is written!"`,
    quizJson: JSON.stringify({
      questions: [
        'What are the "fiery darts" of the wicked, and how does faith quench them?',
        'What is the Sword of the Spirit according to verse 17?',
        'How can you memorize Scripture this week to use as a sword against temptation?'
      ]
    }),
  }
];
