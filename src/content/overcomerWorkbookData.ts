import { OvercomerChallenge } from '../types/workbook';

export const OVERCOMER_FOUNDER_NOTE = {
  title: 'A Note from Our Ministry Founder',
  author: 'Steven Curington (1965-2010)',
  content: `Dear Honored Guest,

Welcome to RU Recovery Program. We are glad you are here! In the upcoming pages, we hope to better acquaint you with our program and to introduce you to our core curriculum. The RU curriculum has been used by countless students to find complete and lasting recovery. The principles you will learn will equip you with the resources necessary to do the same and to be an Overcomer!

The life of an Overcomer can be illustrated by the systems seen on a simple farm. There is a seed, a sower, soil, seasons, and a supply. Each have their own role and when carefully cultivated, a bountiful harvest will be the reward. As stated in our RU motto, the Overcomer can look forward to becoming "...like a tree planted by the rivers of water, that bringeth forth his fruit in his season; his leaf also shall not wither; and whatsoever he doeth shall prosper." (Psalm 1:3). God gives us the supply and strength for each season of life. We must rely on Him during each season, especially when the results may not come as soon as we might have wished. Be assured that God is always at work and that He can turn any seemingly impossible situation and develop it for good in your life.

May God grant you the courage to utilize the resources He has given you and the faith to rely on Him for the results!`,
  signoff: 'Sincerely, Steven Curington (1965-2010)',
};

export const OVERCOMER_STEVE_STORY = {
  title: 'The Story of RU Recovery',
  content: `RU began as a small Bible study class at North Love Baptist Church in Rockford, Illinois. The leader of the Bible study was a young man who had grown up in the church and graduated from its Christian school. His name was Steven Curington.

Even though Steve was raised in a local church, he rejected the truths for many years, resulting in bad friends and foolish choices. His life is a remarkable story of the grace of God in the life of a wayward young man. After experiencing a 10-year addiction to drugs and a serious car accident, Steve was delivered from his addiction through the support of North Love Baptist Church and the truth found in John 8:32, "And ye shall know the truth, and the truth shall make you free." Because of his newfound freedom, Steve was burdened to reach out to others who struggled with stubborn habits and addictions. So, he decided to write a curriculum that would teach them how to read the Bible, study the Bible, memorize the Bible, and hear the Bible preached so that they would spend more time thinking about the Bible. He learned that it was impossible to enslave a Bible-meditating Christian.

This book, the Overcomer, is the first booklet in the curriculum series that Steve wrote. Little did he know the curriculum he would write would grow his small Bible study to over 300 people per week and turn the addictions class into a nationwide addictions program having multiplied hundreds of chapters across the United States and in many foreign countries.`,
};

export const OVERCOMER_PROGRAM_FORMAT = {
  title: 'Program Format: Talk... Talk... Talk...',
  steps: [
    {
      num: 'First',
      text: 'We talk to God in prayer and testimonies.',
      desc: 'We will pray over each prayer request that is shared. Some students will share testimonies (good stories) about what God is doing in their lives. That is how we talk to God. God is pleased when He hears from us. He wants us to ask Him for things, and He wants us to compliment Him to others.',
    },
    {
      num: 'Second',
      text: 'We talk to each other in challenge groups.',
      desc: 'During these sessions, students go through their personal workbooks and discuss the Ten Principles. Some may discuss different personal burdens. Our leaders will instruct them on what the Bible says concerning each of their problems. Tonight, as a first-time guest, you will join the Beginner’s Class. You will be placed into a Challenge Group, and will be introduced to your "Challenge Leader" who will be there for you during times of urgent need.',
    },
    {
      num: 'Finally',
      text: 'God talks to us during the message.',
      desc: 'Your RU Director will present a message from the Bible that is intended to help you understand who God is and how much He wants to help you. We encourage you to participate in all three parts and to even stay afterward to meet new friends.',
    },
  ],
};

export const OVERCOMER_CHALLENGES: OvercomerChallenge[] = [
  {
    id: 1,
    title: 'Challenge 1: Talk... Talk... Talk...',
    subtitle: 'Memorize Our Program Format',
    category: 'memorization',
    instructions:
      'Memorize the RU Program Format listed in italics: "First: we talk to God in prayer and testimonies. Second: we talk to each other in challenge groups. Finally: God talks to us during the message." Quote it to your Challenge Leader so they can sign off on the challenge.',
    formFields: [
      {
        id: 'c1_recitation',
        label: 'Write the 3-part RU Program Format from memory:',
        type: 'textarea',
        placeholder: 'First: ...\nSecond: ...\nFinally: ...',
      },
    ],
  },
  {
    id: 2,
    title: 'Challenge 2: Memorize the RU Slogan',
    subtitle: 'Only the Truth Makes Free!',
    category: 'memorization',
    scripture: {
      reference: 'John 8:32',
      text: 'And ye shall know the truth, and the truth shall make you free.',
    },
    instructions:
      'This slogan is taken from the Bible verse found in John 8:32, where Jesus said, "And ye shall know the truth, and the truth shall make you free." To complete this challenge, memorize the RU Key Slogan, "Only the Truth Makes Free!" and quote it to your Beginner’s Class teacher or your Challenge Leader.',
    formFields: [
      {
        id: 'c2_slogan',
        label: 'Write the RU Key Slogan and scripture reference:',
        type: 'text',
        placeholder: 'Only the Truth Makes Free! (John 8:32)',
      },
      {
        id: 'c2_reflection',
        label: 'What does knowing that Truth is a person (Jesus Christ), not just information, mean to your recovery?',
        type: 'textarea',
        placeholder: 'Personal reflection on the living Truth...',
      },
    ],
  },
  {
    id: 3,
    title: 'Challenge 3: Reading Requirement - Proverbs for 3 Days',
    subtitle: 'Daily Wisdom Meditation (Cleaned & Restored)',
    category: 'reading',
    scripture: {
      reference: 'Joshua 1:8',
      text: 'This book of the law shall not depart out of thy mouth; but thou shalt meditate therein day and night, that thou mayest observe to do according to all that is written therein: for then thou shalt make thy way prosperous, and then thou shalt have good success.',
    },
    instructions:
      'Read one chapter in Proverbs each day for at least three days. We recommend reading the chapter that corresponds with the date (i.e. chapter 1 on the 1st; chapter 10 on the 10th; chapter 25 on the 25th, etc.). List the day, the chapter you read, and a simple thought from each chapter to meditate on.',
    formFields: [
      {
        id: 'c3_day1_chapter',
        label: 'Day #1 Chapter Number:',
        type: 'number',
        placeholder: 'e.g. 1',
      },
      {
        id: 'c3_day1_meditation',
        label: 'Day #1 Meditations (A simple thought to meditate on throughout the day):',
        type: 'textarea',
        placeholder: 'Write your meditation here...',
      },
      {
        id: 'c3_day2_chapter',
        label: 'Day #2 Chapter Number:',
        type: 'number',
        placeholder: 'e.g. 2',
      },
      {
        id: 'c3_day2_meditation',
        label: 'Day #2 Meditations:',
        type: 'textarea',
        placeholder: 'Write your meditation here...',
      },
      {
        id: 'c3_day3_chapter',
        label: 'Day #3 Chapter Number:',
        type: 'number',
        placeholder: 'e.g. 3',
      },
      {
        id: 'c3_day3_meditation',
        label: 'Day #3 Meditations:',
        type: 'textarea',
        placeholder: 'Write your meditation here...',
      },
    ],
  },
  {
    id: 4,
    title: 'Challenge 4: Memorize RU Key Verse (Step One)',
    subtitle: 'Forsaking the Wicked Way',
    category: 'memorization',
    scripture: {
      reference: 'Isaiah 55:7a',
      text: 'Let the wicked forsake his way, and the unrighteous man his thoughts:',
    },
    instructions:
      'Memorize the first part of the RU Key Verse: "Let the wicked forsake his way, and the unrighteous man his thoughts:" Quote it from memory to your Challenge Leader.',
    formFields: [
      {
        id: 'c4_recitation',
        label: 'Recite Isaiah 55:7a from memory:',
        type: 'textarea',
        placeholder: 'Let the wicked forsake his way...',
      },
    ],
  },
  {
    id: 5,
    title: 'Challenge 5: Memorize RU Key Verse (Step Two)',
    subtitle: 'Returning Unto the Lord',
    category: 'memorization',
    scripture: {
      reference: 'Isaiah 55:7b',
      text: 'and let him return unto the LORD, and he will have mercy upon him...',
    },
    instructions:
      'Memorize the second part of the verse: "and let him return unto the LORD, and he will have mercy upon him..." Quote both parts together to your Challenge Leader.',
    formFields: [
      {
        id: 'c5_recitation',
        label: 'Recite complete Isaiah 55:7 from memory:',
        type: 'textarea',
        placeholder: 'Let the wicked forsake his way, and the unrighteous man his thoughts: and let him return unto the LORD, and he will have mercy upon him...',
      },
    ],
  },
  {
    id: 6,
    title: 'Challenge 6: Attendance Requirement - Two Classes in a Row',
    subtitle: 'Earned Milestone: Blue Six-Challenge Badge!',
    category: 'attendance',
    badgeEarned: 'Blue Six-Challenge Name Badge',
    instructions:
      'To complete this challenge, you must attend two RU classes in a row. Your attendance will require that you arrive before the start of the program. Punctuality is a very important form of discipline. You will be required to stay until fellowship time begins.',
    formFields: [
      {
        id: 'c6_class1_date',
        label: 'First Class Date & Time Attended:',
        type: 'text',
        placeholder: 'e.g. Friday, Oct 10 at 7:00 PM',
      },
      {
        id: 'c6_class2_date',
        label: 'Second Consecutive Class Date & Time Attended:',
        type: 'text',
        placeholder: 'e.g. Friday, Oct 17 at 7:00 PM',
      },
      {
        id: 'c6_reflection',
        label: 'What did you observe about punctuality and commitment during these classes?',
        type: 'textarea',
        placeholder: 'Observations on discipline and fellowship...',
      },
    ],
  },
  {
    id: 7,
    title: 'Challenge 7: Nevertheless I Live Student Resource Guide',
    subtitle: 'Complete Talk #3 Outline & Helpful Hints',
    category: 'study',
    instructions:
      'Complete the outline as taught during Talk #3 on one Friday night, and read "Helpful Hints for New Students" located in the Nevertheless I Live Student Resource Guide.',
    formFields: [
      {
        id: 'c7_date_completed',
        label: 'Date Talk #3 Outline Completed:',
        type: 'text',
        placeholder: 'e.g. Oct 17, 2026',
      },
      {
        id: 'c7_key_takeaway',
        label: 'Key spiritual takeaway from Talk #3 & Helpful Hints:',
        type: 'textarea',
        placeholder: 'Write your notes and insights here...',
      },
    ],
  },
  {
    id: 8,
    title: 'Challenge 8: Begin to Memorize the RU Motto: Psalm One',
    subtitle: 'Dissect, Define, and Paraphrase Psalm 1:1',
    category: 'study',
    scripture: {
      reference: 'Psalm 1:1',
      text: 'Blessed is the man that walketh not in the counsel of the ungodly, nor standeth in the way of sinners, nor sitteth in the seat of the scornful.',
    },
    instructions:
      'Using a dictionary (such as Webster’s 1828 edition), define and explain each phrase in your own words. Then, write a paraphrase of Psalm 1:1 and quote it from memory to your Challenge Leader.',
    formFields: [
      {
        id: 'c8_blessed',
        label: 'Definition & Meaning of "Blessed is the man":',
        type: 'textarea',
        placeholder: 'Happy, spiritually joyful, favored by God...',
      },
      {
        id: 'c8_counsel_ungodly',
        label: 'Definition & Meaning of "that walketh not in the counsel of the ungodly":',
        type: 'textarea',
        placeholder: 'Does not follow the advice, philosophies, or guidance of those without God...',
      },
      {
        id: 'c8_way_sinners',
        label: 'Definition & Meaning of "nor standeth in the way of sinners":',
        type: 'textarea',
        placeholder: 'Does not take his stance or linger in the path where sinful practices dwell...',
      },
      {
        id: 'c8_seat_scornful',
        label: 'Definition & Meaning of "nor sitteth in the seat of the scornful":',
        type: 'textarea',
        placeholder: 'Does not settle down with cynical, scoffing, or bitter mockers of sacred things...',
      },
      {
        id: 'c8_paraphrase',
        label: 'Please explain the meaning of Psalm 1:1 as a paraphrase using your own words:',
        type: 'textarea',
        placeholder: 'Write your full personal paraphrase of Psalm 1:1 here...',
      },
    ],
  },
  {
    id: 9,
    title: 'Challenge 9: Reading Requirement - Recovery Without Relapse (Section One)',
    subtitle: 'Freedom, Not Sobriety, Is The Goal',
    category: 'reading',
    instructions:
      'Read the first section summary of "Recover without Relapse" written by Dr. George Crabb and Benjamin Burks. Then answer the 4 questions below based on the text.',
    formFields: [
      {
        id: 'c9_q1',
        label: '1. Most addicts seek ________ instead of complete ________ from their addiction. (Fill in the blanks):',
        type: 'text',
        placeholder: 'e.g. relief / freedom',
      },
      {
        id: 'c9_q2',
        label: '2. After reading this summary, describe the difference between sobriety and freedom in your own words:',
        type: 'textarea',
        placeholder: 'Sobriety is abstaining by willpower; freedom in Christ is...',
      },
      {
        id: 'c9_q3',
        label: '3. In RU, in what does a student need to engage that will lead them to complete recovery?',
        type: 'textarea',
        placeholder: 'Engage in a relationship with Jesus Christ, the Word, and...',
      },
      {
        id: 'c9_q4',
        label: '4. Are you looking for sobriety or complete victory? A quick fix or freedom? Please explain your answer:',
        type: 'textarea',
        placeholder: 'Explain where your heart is right now...',
      },
    ],
  },
  {
    id: 10,
    title: 'Challenge 10: Reading Requirement - Proverbs for 5 Days',
    subtitle: 'Deepening Daily Meditations in the Word',
    category: 'reading',
    instructions:
      'Read one chapter from the book of Proverbs each day for at least five days. Recommend reading the chapter that corresponds with the date. Record the day, chapter, and meditation.',
    formFields: [
      { id: 'c10_d1_ch', label: 'Day #1 Chapter Number:', type: 'number', placeholder: 'Chapter' },
      { id: 'c10_d1_med', label: 'Day #1 Meditations:', type: 'textarea', placeholder: 'Thought to meditate on...' },
      { id: 'c10_d2_ch', label: 'Day #2 Chapter Number:', type: 'number', placeholder: 'Chapter' },
      { id: 'c10_d2_med', label: 'Day #2 Meditations:', type: 'textarea', placeholder: 'Thought to meditate on...' },
      { id: 'c10_d3_ch', label: 'Day #3 Chapter Number:', type: 'number', placeholder: 'Chapter' },
      { id: 'c10_d3_med', label: 'Day #3 Meditations:', type: 'textarea', placeholder: 'Thought to meditate on...' },
      { id: 'c10_d4_ch', label: 'Day #4 Chapter Number:', type: 'number', placeholder: 'Chapter' },
      { id: 'c10_d4_med', label: 'Day #4 Meditations:', type: 'textarea', placeholder: 'Thought to meditate on...' },
      { id: 'c10_d5_ch', label: 'Day #5 Chapter Number:', type: 'number', placeholder: 'Chapter' },
      { id: 'c10_d5_med', label: 'Day #5 Meditations:', type: 'textarea', placeholder: 'Thought to meditate on...' },
    ],
  },
  {
    id: 11,
    title: 'Challenge 11: Attendance Requirement - Sunday Morning RU Class',
    subtitle: 'Corporate Worship & Sunday Class Punctuality',
    category: 'attendance',
    instructions:
      'Attend a Sunday morning RU class in your community (or your local church Sunday School class). Arrive before the start. Punctuality is a form of spiritual discipline.',
    formFields: [
      {
        id: 'c11_date_attended',
        label: 'Date of Sunday Morning Class / Service Attended:',
        type: 'text',
        placeholder: 'e.g. Sunday, Oct 19, 2026',
      },
      {
        id: 'c11_church_name',
        label: 'Church / Sunday School Class Name:',
        type: 'text',
        placeholder: 'e.g. Sunday Sanctuary Class',
      },
      {
        id: 'c11_lesson_takeaway',
        label: 'What did the message or lesson teach you about walking in the Spirit?',
        type: 'textarea',
        placeholder: 'Key lesson takeaway...',
      },
    ],
  },
  {
    id: 12,
    title: 'Challenge 12: Our Key Motto: Psalm One, Verse Two',
    subtitle: 'Dissect, Define & Paraphrase Psalm 1:2 (Earn 12-Challenge Pin!)',
    category: 'study',
    badgeEarned: 'Twelve-Challenge Pin',
    scripture: {
      reference: 'Psalm 1:2',
      text: 'But his delight is in the law of the LORD; and in his law doth he meditate day and night.',
    },
    instructions:
      'Using a dictionary, define the phrases in your own words, write your paraphrase of Psalm 1:2, and quote Psalm 1:1-2 from memory to your Challenge Leader.',
    formFields: [
      {
        id: 'c12_delight',
        label: 'Definition & Meaning of "But his delight":',
        type: 'textarea',
        placeholder: 'Joy, supreme pleasure, desire...',
      },
      {
        id: 'c12_law_lord',
        label: 'Definition & Meaning of "is in the law of the LORD":',
        type: 'textarea',
        placeholder: 'God’s revealed Word, commandments, and truth...',
      },
      {
        id: 'c12_meditate',
        label: 'Definition & Meaning of "and in his law doth he meditate":',
        type: 'textarea',
        placeholder: 'Pondering, reflecting, turning over in mind repeatedly...',
      },
      {
        id: 'c12_day_night',
        label: 'Definition & Meaning of "(both) day and night":',
        type: 'textarea',
        placeholder: 'Continually throughout all hours and situations of life...',
      },
      {
        id: 'c12_paraphrase',
        label: 'Please explain the meaning of Psalm 1:2 as a paraphrase using your own words:',
        type: 'textarea',
        placeholder: 'Write your paraphrase of Psalm 1:2 here...',
      },
    ],
  },
  {
    id: 13,
    title: 'Challenge 13: Reading Requirement - Relapse Is Not Part of Recovery',
    subtitle: 'Recover Without Relapse (Section Two)',
    category: 'reading',
    instructions:
      'Read the second section summary of Recover without Relapse by Dr. George Crabb and Benjamin Burks: "Relapse is Not Part of Recovery (Find the Truth)." Answer the questions below.',
    formFields: [
      {
        id: 'c13_q1',
        label: '1. ________ is not part of ________, nor ________ (Fill in blanks):',
        type: 'text',
        placeholder: 'Relapse / recovery / acceptable',
      },
      {
        id: 'c13_q2',
        label: '2. Relapse is ________, not ________ (Fill in blanks):',
        type: 'text',
        placeholder: 'preventable / inevitable',
      },
      {
        id: 'c13_q3',
        label: '3. After reading summaries one and two, describe in your own words what freedom means to you:',
        type: 'textarea',
        placeholder: 'Freedom to me means...',
      },
      {
        id: 'c13_q4',
        label: '4. Freedom is not a ________ of ________, it is a ________ of ________ (Fill in blanks):',
        type: 'text',
        placeholder: 'byproduct / sobriety / product / Truth',
      },
    ],
  },
  {
    id: 14,
    title: 'Challenge 14: Dissect, Define, and Paraphrase John 8:31-32',
    subtitle: 'The Core Scripture of Freedom',
    category: 'study',
    scripture: {
      reference: 'John 8:31-32',
      text: 'Then said Jesus to those Jews which believed on him, If ye continue in my word, then are ye my disciples indeed; And ye shall know the truth, and the truth shall make you free.',
    },
    instructions:
      'These verses God used to speak to Steve Curington while he lay in a hospital bed after surviving a terrible car accident. Dissect the 7 key words below, then write your personal paraphrase.',
    formFields: [
      { id: 'c14_believed', label: 'Define "Believed":', type: 'text', placeholder: 'Placed faith and total trust in Christ...' },
      { id: 'c14_continue', label: 'Define "Continue":', type: 'text', placeholder: 'Abide, remain, dwell persistently...' },
      { id: 'c14_word', label: 'Define "Word":', type: 'text', placeholder: 'God’s Holy Scripture and living revelation...' },
      { id: 'c14_disciples', label: 'Define "Disciples":', type: 'text', placeholder: 'Devoted learners and followers of Jesus...' },
      { id: 'c14_know', label: 'Define "Know":', type: 'text', placeholder: 'Experiential intimate certainty through fellowship...' },
      { id: 'c14_truth', label: 'Define "Truth":', type: 'text', placeholder: 'Jesus Himself and the unalterable Word of God...' },
      { id: 'c14_free', label: 'Define "Free":', type: 'text', placeholder: 'Delivered from the penalty and power of sin...' },
      {
        id: 'c14_paraphrase',
        label: 'To paraphrase the verses, use your defined words and write what these verses mean to you:',
        type: 'textarea',
        placeholder: 'Write your paraphrase of John 8:31-32 here...',
      },
    ],
  },
  {
    id: 15,
    title: 'Challenge 15: Share the Truth Challenge (Final Graduation Challenge!)',
    subtitle: 'Earned Milestone: Overcomer Graduate & John/Romans Edition!',
    category: 'action',
    badgeEarned: 'Overcomer Graduate & RU John/Romans',
    scripture: {
      reference: 'Luke 14:23',
      text: 'And the lord said unto the servant, Go out into the highways and hedges, and compel them to come in, that my house may be filled.',
    },
    instructions:
      'Give an RU brochure, gospel tract, or testimony to someone in your community so that others may come to find freedom that is only found in Jesus Christ! Record whom you shared with and your experience.',
    formFields: [
      {
        id: 'c15_person_shared',
        label: 'Whom did you share with (or location/circumstance):',
        type: 'text',
        placeholder: 'e.g. Co-worker, neighbor, or person at store',
      },
      {
        id: 'c15_date_shared',
        label: 'Date Shared:',
        type: 'text',
        placeholder: 'e.g. Oct 20, 2026',
      },
      {
        id: 'c15_experience',
        label: 'Describe your conversation and how sharing Christ’s freedom impacted both of you:',
        type: 'textarea',
        placeholder: 'Describe your witnessing experience...',
      },
    ],
  },
];

export const OVERCOMER_CLOSING_NOTE = {
  title: 'A Closing Note Written by Steve Curington to Overcomer Graduates...',
  content: `Congratulations! You have completed your first RU workbook. As an "Overcomer," you have overcome many obstacles to help you in your growth as an RU student. Obstacles that have made it difficult to attend class twice in a row. Obstacles that were intended to keep you from class. Obstacles that hindered your ability to memorize verses and probably many other obstacles and adversities that were intended to keep you from becoming an "Overcomer." How did it happen? I believe God helped you do the work. That's right. I believe He is real and is beginning to show Himself to you.

As a result of your successful completion of the Overcomer handbook, you are now an official "RU Overcomer"!

Speaking of next steps, I want you to read the story that follows my congratulations to you, entitled, "RU Taking Too Many Steps?" I don't want you to think that freedom is a large number of steps. There is just one step to get right—belief in Jesus to save you. But, there are many steps to stay right. I look forward to teaching you those in our studies of the RU Ten Principles.

You will now enter into the Challenger level of our program. Your Challenge Group Leader or resource table worker will help you determine your next book—the Challenger Workbook or the complete Strongholds study course. It will begin to introduce you to the Truth of Jesus, and how knowing Him will make you free...finally.

Thanks for being a student of RU; we hope to serve you well,

Steven Curington (1965-2010)`,
};

export const OVERCOMER_TINA_MORRIS_ARTICLE = {
  title: 'RU Taking Too Many Steps? The Differences between RU Recovery and Other Twelve-Step Programs',
  author: 'By Tina Morris, A Graduate Student',
  content: `Two years ago, I came to RU after several years of sobriety in a 12-step program. I attended church for some time and was extremely confused between what I was learning from my Bible reading and what I was learning through my 12-step program and those in attendance. The confusion was so great, that I became discouraged and stopped attending both church and my program. One night, shortly thereafter, I began indulging in my addiction.

I realized this certainly wasn't the answer. If I didn't do something fast, I was going to fall right back into the bondage of addiction. That's when I heard about RU Recovery on the radio. I decided to attend.

The very first night I attended RU, I found it quite different from my 12-step program. In fact, I found myself judging everything about it the whole time I was there. However, after I arrived home that night, I thought about how it compared to my 12-step program. I will explain those comparisons in a moment.

At first, I didn't want to face the truth about what I discovered; however, my life and my family's lives were on the line. I discovered that everything, without hesitation, taught at RU was biblical. I couldn't deny that. I also realized that my confusion between church and my 12-step program was coming from a desire to live "my way." My 12-step program encouraged this. I could live a somewhat changed life, but could hold on to areas in my life I wasn't ready or willing to give up. This justification came from the fact that both believers and non-believers attend 12-step programs. You're going to get conflicting views - views that rationalize unhealthy, wrong behavior. I found this part of my 12-step program appealing. I do want life "my way" even though this is not the best way. This type of thinking, I soon realized, only gives room for more misery, more destruction, and more pain.

I do believe a 12-step program can change some people's lives for the better as I experienced some good change. However, it didn't have Christ. It did not have people who care and who have the love of Christ in their heart. It didn't have leaders who live a Christ-like lifestyle, who all give the same biblical answers to everyone's problems. It did not have multiple testimonies each week on consistent, complete, inner change.

If God is speaking to your heart, you will have a pull between your 12-step programs and RU Recovery. Our worldly desires are strong. Our human nature is to do wrong. We really may want to do good; and at the same time, display unhealthy bad habits. Here is where we need to be very clear. God knows this. Yet, He still desires for us to keep on walking the Christian walk. The only way to do this is to literally flood our life with God's Word (the Bible), God's People (the church), and God's Grace (His forgiveness of our wrong). We can't have lasting change in our life when we allow conflicting teachings to cloud our understanding of God. The Bible needs to be our Rule Book from which we govern our lives. If you believe at all, even the slightest bit, in the Bible, your only choice is to take in the whole Truth and begin applying it to your life.

Please read the next four points. They are what made me choose to stay at RU Recovery despite the fact I wanted to live life "my way," despite the fact I was still confused about how to live "God's way."

1. RU Recovery is Christ-centered. Here, our common bond is not our problem, but rather our solution - Jesus Christ. No matter what your addiction or sinful habit, at RU, Christ is our only True Deliverer from our problems. "And he said, The LORD is my rock, and my fortress, and my deliverer;" (2 Samuel 22:2)

2. RU Recovery is people-centered. We are brothers and sisters in Christ. We help one another because God's Word tells us to. It's not to help our own sobriety, though it does; it's to obey God's word. The benefit of this is true love toward others out of a joyful heart that longs to share Christ and His Freedom with them. (Philippians 2:2-4, Galatians 5:22-23)

3. RU Recovery has Christian leaders who love the Lord, know God's Word, and give advice based on it. While they do not judge others for their opinions, God's Word is Truth. Any opinion other than God's Word can only bring confusion, frustration, anger, and depression; as it did in my life and has in yours as well. (Psalm 1:1)

4. RU Recovery, through the teaching of God's Word, the dedication of God's people, and the abundance of God's grace, offers complete inner change. Can you experience change in your 12-step program? Yes, it is possible. But here is a Bible verse to consider: "That we henceforth be no more children, tossed to and fro, and carried about with every wind of doctrine, by the sleight of men, and cunning craftiness, whereby they lie in wait to deceive;" (Ephesians 4:14, 1 John 1:5-7)

You see, the 12-steps offer change, but not Christ-like change. Their "doctrine" is not a complete picture of Christ, nor does it give credit to Christ for any part of its "doctrine". Therefore, you will end up sacrificing the character traits only God can instill in you.

Do you walk in darkness and claim to know Christ? He wants you in His Light. Free from addiction. Free to be a light in a dark world. Free to be complete in Him. Free, to let the Truth set you Free! Please continue to visit and test for yourself what I've written. It's the Truth and the Truth can only speak for itself.`,
};
