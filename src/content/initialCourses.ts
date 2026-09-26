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
];
