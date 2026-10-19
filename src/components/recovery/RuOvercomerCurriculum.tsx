import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Award, CheckCircle2, ChevronRight, Sparkles, 
  Flame, Shield, Heart, Trophy, Save, Lock, Download, 
  HelpCircle, Check, Star, RefreshCw, Feather, UserCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { soundEffects } from '../../services/audio';
import confetti from 'canvas-confetti';

interface OvercomerLesson {
  id: number;
  title: string;
  subtitle: string;
  principleRef: string;
  memoryVerses: { reference: string; text: string }[];
  summary: string;
  keyTruth: string;
  commentary: string[];
  homeworkQuestions: { id: string; question: string; hint?: string }[];
  weeklyActionStep: string;
  prayer: string;
}

const OVERCOMER_LESSONS: OvercomerLesson[] = [
  {
    id: 1,
    title: "Lesson 1: Foundations of Victory & The Power of Christ",
    subtitle: "Taking God's Side Against the Stronghold",
    principleRef: "RU Principle 1: If God is against it, so am I! (Galatians 5:19-24)",
    memoryVerses: [
      {
        reference: "Galatians 5:16",
        text: "This I say then, Walk in the Spirit, and ye shall not fulfil the lust of the flesh."
      },
      {
        reference: "1 Corinthians 10:13",
        text: "There hath no temptation taken you but such as is common to man: but God is faithful, who will not suffer you to be tempted above that ye are able; but will with the temptation also make a way to escape, that ye may be able to bear it."
      }
    ],
    summary: "Addiction and compulsive bondage cannot be broken through mere human willpower or secular formulas. Victory begins when we stop making excuses, align our mind with God's Word, and rely completely on the Holy Spirit.",
    keyTruth: "You cannot manage or compromise with a stronghold. When you agree with God that your sin is destructive, Christ's resurrection power is unleashed to make you an overcomer.",
    commentary: [
      "In Reformers Unanimous, we do not call addiction a disease of victimhood; we call it what God's Word calls it: a spiritual stronghold and bondage to the flesh. This is glorious news because if it were a permanent disease, you would never be truly free. But because Christ died to deliver us from the power of sin, complete freedom is promised to all who believe.",
      "The first step in The Overcomer Book is aligning your will with God. When temptation whispers that your indulgence is harmless or deserved, you must boldly declare: 'If God is against it, so am I!'",
      "Notice that Galatians 5:16 does not say 'resist the flesh and then walk in the Spirit.' It says 'Walk in the Spirit, AND ye shall not fulfil the lust of the flesh.' When you fill your day with Scripture, prayer, and godly fellowship, the flesh is starved of its oxygen."
    ],
    homeworkQuestions: [
      {
        id: "l1_q1",
        question: "1. What specific habits, substances, or compulsive strongholds are you surrendering to Jesus Christ right now?",
        hint: "Be completely specific. Honest confession before God is the foundation of recovery."
      },
      {
        id: "l1_q2",
        question: "2. Based on Galatians 5:16, what does God promise will happen when you actively walk in the Holy Spirit?",
        hint: "Reflect on how feeding the spirit starves the appetites of the flesh."
      },
      {
        id: "l1_q3",
        question: "3. Name 3 everyday situations or places where you must take God's side against your flesh this week.",
        hint: "Think about times of day, isolation, digital habits, or old acquaintances."
      }
    ],
    weeklyActionStep: "Write out Galatians 5:16 on a card. Carry it in your pocket or save it on your phone lockscreen. Recite it out loud at the first flash of temptation.",
    prayer: "Lord Jesus, I surrender my excuses, my compromises, and my habits to Your authority. If You are against it, so am I. Fill me with Your Holy Spirit and grant me the grace to walk in victory today. Amen."
  },
  {
    id: 2,
    title: "Lesson 2: The Heart of the Problem",
    subtitle: "Understanding Root Sins vs. Outward Symptoms",
    principleRef: "RU Principle 2: Every sin has its origin in our hearts! (Jeremiah 17:9, Mark 7:21-23)",
    memoryVerses: [
      {
        reference: "Proverbs 4:23",
        text: "Keep thy heart with all diligence; for out of it are the issues of life."
      },
      {
        reference: "Jeremiah 17:9",
        text: "The heart is deceitful above all things, and desperately wicked: who can know it?"
      }
    ],
    summary: "Addiction is never just about the bottle, the pill, or the screen. The outward behavior is merely the symptom; the heart is the true fountainhead of our actions. Behavior modification fails because only Jesus can transform the heart.",
    keyTruth: "When you fixate only on stopping the outward act without dealing with the inward pride, resentment, or anxiety in your heart, relapse is inevitable.",
    commentary: [
      "In Mark 7:21-23, Jesus explained that from within, out of the heart of men, proceed evil thoughts, adulteries, fornications, and foolishness. The world tells you that your environment made you do it. God's Word shows that external triggers only draw out what is already stored in the inner man.",
      "The deceitfulness of the heart means that our flesh will construct convincing justifications: 'I had a stressful day,' 'Nobody understands how hard I have it,' or 'Just this one last time.' Recognizing that your heart is deceitful trains you to test your thoughts against Scripture rather than trusting your feelings.",
      "Keeping the heart with all diligence means setting spiritual filters at the eye-gate and the ear-gate, guarding what you allow into your mind each morning and evening."
    ],
    homeworkQuestions: [
      {
        id: "l2_q1",
        question: "1. What deceitful rationalizations has your heart used in the past to justify giving in to temptation?",
        hint: "Example: 'I'll start over tomorrow' or 'I deserve relief after a tough week'."
      },
      {
        id: "l2_q2",
        question: "2. What deeper root emotions (loneliness, anger, pride, boredom, fear) usually precede your urge to act out?",
        hint: "HALT: Are you Hungry, Angry, Lonely, or Tired?"
      },
      {
        id: "l2_q3",
        question: "3. How does Proverbs 4:23 command us to guard our heart, and what practical spiritual filters will you establish?",
        hint: "Consider what music, media, conversations, and social feeds you consume."
      }
    ],
    weeklyActionStep: "Conduct a 10-minute nightly heart inventory before sleep. Ask the Lord: 'Search me, O God, and know my heart: try me, and know my thoughts' (Psalm 139:23).",
    prayer: "Heavenly Father, create in me a clean heart and renew a right spirit within me. Expose every hidden lie, resentment, and deceitful desire. I invite You to govern my thoughts today. Amen."
  },
  {
    id: 3,
    title: "Lesson 3: The Principle of Prevention & Clean Living",
    subtitle: "Eliminating Triggers Before Temptation Strikes",
    principleRef: "RU Principle 3 & 5: Easier to keep the heart clean than clean it defiled; Small compromises lead to great disasters.",
    memoryVerses: [
      {
        reference: "Proverbs 22:3",
        text: "A prudent man foreseeth the evil, and hideth himself: but the simple pass on, and are punished."
      },
      {
        reference: "Romans 13:14",
        text: "But put ye on the Lord Jesus Christ, and make not provision for the flesh, to fulfil the lusts thereof."
      }
    ],
    summary: "Prevention is infinitely easier than recovery after a fall. A prudent Christian recognizes spiritual ambushes in advance and takes proactive evasion steps, refusing to make any provision for the flesh.",
    keyTruth: "Great shipwrecks of faith always begin with little leaks of compromise. If you refuse the small compromise, you never have to face the catastrophic fall.",
    commentary: [
      "No one wakes up and abruptly decides to destroy their marriage, career, or health. It begins when someone drives past an old hangout, keeps a secret app on their phone, or lingers in a toxic conversation. In Song of Solomon 2:15, Scripture warns of the 'little foxes that spoil the vines.'",
      "Romans 13:14 commands us to make no provision for the flesh. Making provision means leaving an escape hatch open just in case you want to indulge later. True victory requires burning the bridges back to your old bondage.",
      "Cleaning a defiled heart involves tears, guilt, broken trust, and spiritual warfare. Keeping it clean simply requires daily prayer, timely boundaries, and fleeing temptation like Joseph fled Potiphar's wife."
    ],
    homeworkQuestions: [
      {
        id: "l3_q1",
        question: "1. What are your specific 'provisions for the flesh' (saved phone numbers, hidden money, unmonitored devices, isolated hours) that need to be eliminated today?",
        hint: "Radical honesty: what have you kept 'just in case'?"
      },
      {
        id: "l3_q2",
        question: "2. Think of a past relapse or setback. Trace it backward—what was the very first small compromise that led up to it?",
        hint: "Notice the sequence: Compromised thought -> Compromised environment -> Action."
      },
      {
        id: "l3_q3",
        question: "3. What specific hedge of protection or digital content filter will you put in place this week?",
        hint: "Examples: accountability apps, password sharing, avoiding certain routes or friends."
      }
    ],
    weeklyActionStep: "Purge every remaining trigger: delete toxic contacts, clear browser history, install accountability software, and throw away any lingering paraphernalia or secret stashes.",
    prayer: "Lord, give me the wisdom of the prudent man to foresee the snare and flee from it. Grant me holy courage to cut off every provision for the flesh and walk in purity today. Amen."
  },
  {
    id: 4,
    title: "Lesson 4: Starving the Appetite & Renewing the Mind",
    subtitle: "Putting Off the Old Man & Putting On the New Man",
    principleRef: "RU Principle 4: You cannot fight a fleshly appetite by indulging in it! (Romans 12:2, Ephesians 4:22-24)",
    memoryVerses: [
      {
        reference: "Romans 12:2",
        text: "And be not conformed to this world: but be ye transformed by the renewing of your mind, that ye may prove what is that good, and acceptable, and perfect, will of God."
      },
      {
        reference: "Ephesians 4:22-24",
        text: "That ye put off concerning the former conversation the old man, which is corrupt according to the deceitful lusts; And be renewed in the spirit of your mind; And that ye put on the new man, which after God is created in righteousness and true holiness."
      }
    ],
    summary: "You cannot appease a fire by feeding it fuel; you cannot pacify an addiction by giving in 'just one more time.' Victory occurs when you starve the old appetite and fill your mind with the transforming Word of God.",
    keyTruth: "The mind cannot remain empty. It is not enough to stop bad habits; you must aggressively replace them with active devotion to Jesus Christ and service to others.",
    commentary: [
      "In RU, we emphasize the biblical principle of 'Put Off, Be Renewed, Put On' from Ephesians 4. If an alcoholic merely stops drinking but spends his evenings sitting in the same dark room staring at the TV, his mind will soon obsess over the old vice. He must put on prayer, Bible study, church ministry, and healthy exercise.",
      "Fleshly appetites grow louder when fed, but when starved, their demands lose intensity over time. Christ promised in John 8:36, 'If the Son therefore shall make you free, ye shall be free indeed.'",
      "Renewing your mind requires soaking in Scripture until God's thoughts become your natural reaction to temptation."
    ],
    homeworkQuestions: [
      {
        id: "l4_q1",
        question: "1. Why does giving into a fleshly desire 'just once' always increase the cravings instead of satisfying them?",
        hint: "Indulgence validates the appetite; starvation weakens its hold."
      },
      {
        id: "l4_q2",
        question: "2. What 3 wholesome, godly spiritual habits are you actively 'putting on' to replace old idle or destructive routines?",
        hint: "Examples: morning devotional, attending church services, volunteering, Scripture memory."
      },
      {
        id: "l4_q3",
        question: "3. What biblical promise will you quote out loud when an intense urge tries to overwhelm your thoughts?",
        hint: "Choose a verse such as 1 Corinthians 10:13, Philippians 4:13, or Romans 8:1."
      }
    ],
    weeklyActionStep: "Spend 20 minutes each day in dedicated Scripture study and prayer. When an urge strikes, do 10 pushups, quote your memory verse, and call a godly brother or sister immediately.",
    prayer: "Lord Jesus, I choose to put off the old corrupt habits of the flesh. Wash my mind with the water of Your Word. Clothe me in Your righteousness and teach me to find supreme delight in You. Amen."
  },
  {
    id: 5,
    title: "Lesson 5: Breaking Isolation & Godly Companions",
    subtitle: "Choosing Accountability and Healthy Church Fellowship",
    principleRef: "RU Principle 6: Those who do not love the Lord will not help us serve the Lord! (2 Corinthians 6:14, Hebrews 10:24-25)",
    memoryVerses: [
      {
        reference: "1 Corinthians 15:33",
        text: "Be not deceived: evil communications corrupt good manners."
      },
      {
        reference: "Hebrews 10:24-25",
        text: "And let us consider one another to provoke unto love and to good works: Not forsaking the assembling of ourselves together, as the manner of some is; but exhorting one another: and so much the more, as ye see the day approaching."
      }
    ],
    summary: "Addiction thrives in darkness and isolation. The enemy isolates the believer so he can devour him. Lasting freedom requires walking in the light, choosing godly companions, and committing faithfully to a local Bible-preaching church and recovery fellowship.",
    keyTruth: "You cannot hang out in the barber shop without eventually getting a haircut. If your companions do not love Jesus, they will inevitably pull you back into bondage.",
    commentary: [
      "Steve Curington, founder of Reformers Unanimous, frequently taught Principle #6: 'Those who do not love the Lord will not help us serve the Lord.' Many sincere believers relapse because they falsely believe they can be a missionary to their former drinking or drug buddies while in early recovery.",
      "Ecclesiastes 4:9-10 reminds us: 'Two are better than one... For if they fall, the one will lift up his fellow: but woe to him that is alone when he falleth; for he hath not another to help him up.'",
      "Attending your weekly RU chapter (like the Friday 7 PM meeting at Emmanuel Baptist Church in Winchester off Route 50) surrounds you with overcomers who pray for you, celebrate your victories, and keep you grounded in God's grace."
    ],
    homeworkQuestions: [
      {
        id: "l5_q1",
        question: "1. Are there people in your daily life or social circle who do not love the Lord and tempt you toward compromise? How will you set firm boundaries with them?",
        hint: "You may need to change phone numbers or politely step away from old social gatherings."
      },
      {
        id: "l5_q2",
        question: "2. Who is your primary Christian accountability partner or recovery mentor? How frequently do you talk?",
        hint: "Authentic accountability means someone who has permission to ask the tough questions."
      },
      {
        id: "l5_q3",
        question: "3. What local church and RU meeting chapter are you committing to attend weekly?",
        hint: "Commitment to attendance breaks the isolation that feeds relapse."
      }
    ],
    weeklyActionStep: "Attend your weekly Friday RU meeting. Introduce yourself to the director or leader, and exchange phone numbers with a mature brother or sister in Christ.",
    prayer: "Father, forgive me for the times I have isolated myself or relied on ungodly counsel. Surround me with brothers and sisters who spur me toward holiness. Give me humility to be accountable. Amen."
  },
  {
    id: 6,
    title: "Lesson 6: Taking Full Responsibility & God's Total Cleansing",
    subtitle: "The Overcomer's Victory in Christ Jesus",
    principleRef: "RU Principle 10: God balances guilt with blame! When we accept the blame, God removes the guilt. (1 John 1:9, Proverbs 28:13)",
    memoryVerses: [
      {
        reference: "1 John 1:9",
        text: "If we confess our sins, he is faithful and just to forgive us our sins, and to cleanse us from all unrighteousness."
      },
      {
        reference: "Proverbs 28:13",
        text: "He that covereth his sins shall not prosper: but whoso confesseth and forsaketh them shall have mercy."
      }
    ],
    summary: "Guilt is a spiritual red light warning that sin is unconfessed. The world tells you to shift blame to your parents, your past, or your genetics. RU teaches that when you accept 100% personal blame, God immediately eliminates 100% of the guilt through the blood of Jesus Christ.",
    keyTruth: "You cannot be forgiven for an excuse; you can only be forgiven for a sin. When you own your failure before the Cross, Jesus cleanses you and clothes you as an Overcomer.",
    commentary: [
      "In RU Principle 10, Steve Curington taught that guilt and blame are balanced on a spiritual scale. As long as you blame others, you carry the heavy burden of unresolved guilt. But the moment you stand before God and say, 'I chose this sin; I am to blame,' God's scale tips. Christ's blood cleanses you, and the guilt is completely removed!",
      "Notice 1 John 1:9 says God is 'faithful and just' to forgive us. Because Christ already bore your full penalty on Mount Calvary, God's justice is satisfied. You are not on probation; you are a redeemed son or daughter of the Living God.",
      "Congratulations on reaching Lesson 6 of The Overcomer Book! By completing these foundational lessons, engaging in daily study, and walking in the Spirit, you are equipped to live as more than a conqueror through Him that loved us."
    ],
    homeworkQuestions: [
      {
        id: "l6_q1",
        question: "1. How has shifting blame to others in the past kept you trapped in guilt and cycle of addiction?",
        hint: "Blame-shifting keeps you powerless; personal responsibility opens the door to forgiveness."
      },
      {
        id: "l6_q2",
        question: "2. According to 1 John 1:9, what two things does God promise when we honestly confess our sins?",
        hint: "He forgives our sins AND cleanses us from all unrighteousness."
      },
      {
        id: "l6_q3",
        question: "3. Write your personal testimony of victory in Christ: How has God delivered and transformed you throughout this Overcomer course?",
        hint: "Your testimony will be a beacon of hope to the next newcomer walking into an RU meeting."
      }
    ],
    weeklyActionStep: "Complete all homework answers, celebrate your Overcomer Course Graduation, receive your official RU Overcomer Certificate, and share your praise testimony with your fellowship!",
    prayer: "Lord Jesus, I take full responsibility for my past. I bring every sin to Your Cross, claiming Your promise in 1 John 1:9. Thank You for total forgiveness, total cleansing, and eternal victory! I am an Overcomer through Jesus Christ! Amen."
  }
];

export const RuOvercomerCurriculum: React.FC = () => {
  const { user } = useAuth();
  const effectiveUserId = user?.id || (user?.email?.toLowerCase().includes('tex') ? 'user_tex' : (localStorage.getItem('aura_cached_user_id') || 'user_tex'));

  const [activeLessonId, setActiveLessonId] = useState<number>(1);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [completedLessons, setCompletedLessons] = useState<number[]>([]);
  const [points, setPoints] = useState<number>(50);
  const [awards, setAwards] = useState<string[]>(['Overcomer Enrolled']);
  const [dailyChecks, setDailyChecks] = useState<Record<string, boolean>>({
    bibleReading: false,
    prayerTime: false,
    principleMeditation: false,
  });
  const [savingStatus, setSavingStatus] = useState<string | null>(null);
  const [showCertificateModal, setShowCertificateModal] = useState<boolean>(false);

  const activeLesson = OVERCOMER_LESSONS.find(l => l.id === activeLessonId) || OVERCOMER_LESSONS[0];
  const todayStr = new Date().toISOString().split('T')[0];

  // Load progress from backend server database
  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const res = await fetch(`/api/recovery/overcomer/${encodeURIComponent(effectiveUserId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.progress) {
            setCompletedLessons(data.progress.completedLessons || []);
            setPoints(data.progress.points || 50);
            setAwards(data.progress.awards || ['Overcomer Enrolled']);
            
            // Merge answers for current lesson
            const currentLessonAnswers = data.progress.lessonAnswers?.[activeLessonId] || {};
            setAnswers(currentLessonAnswers);

            // Daily checkins for today
            if (data.progress.dailyCheckins?.[todayStr]) {
              setDailyChecks({
                bibleReading: Boolean(data.progress.dailyCheckins[todayStr].bibleReading),
                prayerTime: Boolean(data.progress.dailyCheckins[todayStr].prayerTime),
                principleMeditation: Boolean(data.progress.dailyCheckins[todayStr].principleMeditation),
              });
            }
          }
        }
      } catch (e) {
        console.warn('Failed to load Overcomer progress from server:', e);
      }
    };
    fetchProgress();
  }, [effectiveUserId, activeLessonId, todayStr]);

  const handleAnswerChange = (qId: string, val: string) => {
    setAnswers(prev => ({ ...prev, [qId]: val }));
  };

  const handleSaveHomework = async (markComplete = false) => {
    soundEffects.playTap();
    setSavingStatus('saving');

    try {
      const res = await fetch(`/api/recovery/overcomer/${encodeURIComponent(effectiveUserId)}/lesson/${activeLessonId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers,
          completed: markComplete
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.progress) {
          setCompletedLessons(data.progress.completedLessons || []);
          setPoints(data.progress.points || points);
          setAwards(data.progress.awards || awards);
        }

        if (markComplete) {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
          });
          soundEffects.success();
          if (activeLessonId === 6) {
            setShowCertificateModal(true);
          }
        }
        setSavingStatus('saved');
        setTimeout(() => setSavingStatus(null), 3000);
      }
    } catch (e) {
      console.warn('Failed to save homework:', e);
      setSavingStatus('error');
    }
  };

  const handleDailyCheck = async (key: 'bibleReading' | 'prayerTime' | 'principleMeditation') => {
    soundEffects.playTap();
    const nextVal = !dailyChecks[key];
    setDailyChecks(prev => ({ ...prev, [key]: nextVal }));

    if (nextVal) {
      setPoints(prev => prev + 10);
    }

    try {
      await fetch(`/api/recovery/overcomer/${encodeURIComponent(effectiveUserId)}/daily-check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateStr: todayStr,
          itemKey: key,
          value: nextVal
        })
      });
    } catch (e) {
      console.warn('Failed to sync daily check:', e);
    }
  };

  const isCurrentLessonComplete = completedLessons.includes(activeLessonId);
  const is300ClubUnlocked = points >= 300 || awards.includes('300 Club Award Pin');
  const is400ClubUnlocked = points >= 400 || awards.includes('400 Club Victory Medallion');
  const isGraduated = completedLessons.length >= 6;

  return (
    <div className="space-y-8">
      {/* Hero: The Overcomer Book & 300 Club Tracker */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-amber-950/70 via-slate-900 to-yellow-950/40 border border-amber-500/40 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black uppercase tracking-wider border border-amber-500/30 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                <span>The Overcomer Book • Book 1 of RU Recovery</span>
              </span>
              {isGraduated && (
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black uppercase tracking-wider border border-emerald-500/30 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" />
                  <span>Graduate Completed</span>
                </span>
              )}
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Overcoming Addiction & Strongholds Through Christ
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              The foundational introductory curriculum of Reformers Unanimous. Work through each weekly lesson, memorize Scripture, complete daily spiritual disciplines, and earn official RU rewards and the 300 Club Award.
            </p>
          </div>

          {/* 300 Club Score Card & Milestones */}
          <div className="p-5 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md flex flex-col gap-3 shrink-0 min-w-[280px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>300 Club Score</span>
              </span>
              <span className="text-xl font-black text-amber-400">
                {points} <span className="text-xs text-slate-400 font-semibold">/ 300 pts</span>
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-500"
                style={{ width: `${Math.min(100, (points / 300) * 100)}%` }}
              />
            </div>

            {/* Badges / Awards Quick Preview */}
            <div className="flex items-center gap-2 pt-1">
              <div className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 border ${
                is300ClubUnlocked 
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' 
                  : 'bg-white/5 border-white/10 text-slate-500'
              }`}>
                <Star className="w-3 h-3 fill-current" />
                <span>300 Club Pin</span>
              </div>

              <div className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 border ${
                is400ClubUnlocked 
                  ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300' 
                  : 'bg-white/5 border-white/10 text-slate-500'
              }`}>
                <Award className="w-3 h-3" />
                <span>400 Club</span>
              </div>

              {isGraduated && (
                <button
                  onClick={() => setShowCertificateModal(true)}
                  className="px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center gap-1 ml-auto hover:bg-emerald-500/30 transition-colors"
                >
                  <Award className="w-3 h-3" />
                  <span>Certificate</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Daily Discipline Tracker (Earning Weekly Points) */}
        <div className="mt-6 pt-6 border-t border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-orange-400" />
                <span>Daily Overcomer Disciplines ({todayStr})</span>
              </h4>
              <p className="text-xs text-slate-400">Complete daily quiet time and Scripture reading to earn +10 points each.</p>
            </div>
            <span className="text-xs font-bold text-emerald-400">
              +{((dailyChecks.bibleReading ? 10 : 0) + (dailyChecks.prayerTime ? 10 : 0) + (dailyChecks.principleMeditation ? 10 : 0))} pts earned today
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => handleDailyCheck('bibleReading')}
              className={`p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between ${
                dailyChecks.bibleReading
                  ? 'bg-emerald-950/40 border-emerald-500/50 text-white shadow-md shadow-emerald-950/20'
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <BookOpen className={`w-4 h-4 ${dailyChecks.bibleReading ? 'text-emerald-400' : 'text-slate-400'}`} />
                <div>
                  <p className="text-xs font-bold">Daily Bible Reading</p>
                  <p className="text-[10px] text-slate-400">15 min in Scripture</p>
                </div>
              </div>
              <div className={`w-5 h-5 rounded-lg border flex items-center justify-center ${
                dailyChecks.bibleReading ? 'bg-emerald-500 border-emerald-400 text-slate-950' : 'border-white/20'
              }`}>
                {dailyChecks.bibleReading && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </button>

            <button
              onClick={() => handleDailyCheck('prayerTime')}
              className={`p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between ${
                dailyChecks.prayerTime
                  ? 'bg-emerald-950/40 border-emerald-500/50 text-white shadow-md shadow-emerald-950/20'
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <Heart className={`w-4 h-4 ${dailyChecks.prayerTime ? 'text-emerald-400' : 'text-slate-400'}`} />
                <div>
                  <p className="text-xs font-bold">Quiet Time & Prayer</p>
                  <p className="text-[10px] text-slate-400">Confession & praise</p>
                </div>
              </div>
              <div className={`w-5 h-5 rounded-lg border flex items-center justify-center ${
                dailyChecks.prayerTime ? 'bg-emerald-500 border-emerald-400 text-slate-950' : 'border-white/20'
              }`}>
                {dailyChecks.prayerTime && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </button>

            <button
              onClick={() => handleDailyCheck('principleMeditation')}
              className={`p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between ${
                dailyChecks.principleMeditation
                  ? 'bg-emerald-950/40 border-emerald-500/50 text-white shadow-md shadow-emerald-950/20'
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <Shield className={`w-4 h-4 ${dailyChecks.principleMeditation ? 'text-emerald-400' : 'text-slate-400'}`} />
                <div>
                  <p className="text-xs font-bold">RU Principle Meditation</p>
                  <p className="text-[10px] text-slate-400">Review 10 Principles</p>
                </div>
              </div>
              <div className={`w-5 h-5 rounded-lg border flex items-center justify-center ${
                dailyChecks.principleMeditation ? 'bg-emerald-500 border-emerald-400 text-slate-950' : 'border-white/20'
              }`}>
                {dailyChecks.principleMeditation && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Lesson Selector Tabs */}
      <div className="space-y-3">
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-amber-400" />
          <span>The Overcomer Lessons (Book 1)</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {OVERCOMER_LESSONS.map((l) => {
            const isCompleted = completedLessons.includes(l.id);
            const isCurrent = activeLessonId === l.id;

            return (
              <button
                key={l.id}
                onClick={() => {
                  soundEffects.playTap();
                  setActiveLessonId(l.id);
                }}
                className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between min-h-[90px] ${
                  isCurrent
                    ? 'bg-amber-600 border-amber-400 text-white shadow-lg shadow-amber-600/30'
                    : isCompleted
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-slate-200 hover:bg-emerald-950/50'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={`text-[11px] font-black uppercase tracking-wider ${isCurrent ? 'text-amber-200' : 'text-slate-400'}`}>
                    Lesson {l.id}
                  </span>
                  {isCompleted && (
                    <CheckCircle2 className={`w-4 h-4 ${isCurrent ? 'text-white' : 'text-emerald-400'}`} />
                  )}
                </div>
                <p className={`text-xs font-bold line-clamp-2 mt-1 leading-snug ${isCurrent ? 'text-white' : 'text-slate-300'}`}>
                  {l.title.replace(/Lesson \d+: /, '')}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Lesson Content Body */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-white/10 shadow-xl space-y-8">
        {/* Lesson Header */}
        <div className="space-y-3 border-b border-white/10 pb-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black uppercase tracking-wider border border-amber-500/30">
              {activeLesson.principleRef}
            </span>
            {isCurrentLessonComplete ? (
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Lesson Completed (+75 pts)</span>
              </span>
            ) : (
              <span className="text-xs text-slate-400 font-semibold">
                In Progress • Complete homework to earn +75 pts
              </span>
            )}
          </div>

          <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">
            {activeLesson.title}
          </h3>
          <p className="text-base text-amber-300 font-semibold">
            {activeLesson.subtitle}
          </p>
          <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
            {activeLesson.summary}
          </p>
        </div>

        {/* Scripture Memory Drill Box */}
        <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-500/30 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <h4 className="font-black text-white text-sm sm:text-base">
                Scripture Memory Work
              </h4>
            </div>
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              Weekly Memory Drill
            </span>
          </div>

          <div className="space-y-3">
            {activeLesson.memoryVerses.map((v, i) => (
              <div key={i} className="p-4 rounded-xl bg-black/30 border border-white/5 space-y-1">
                <span className="text-xs font-bold text-amber-400">— {v.reference}</span>
                <p className="text-sm text-slate-100 font-serif leading-relaxed italic">
                  "{v.text}"
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Expository Teaching & Commentary */}
        <div className="space-y-4">
          <h4 className="font-black text-white text-base flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>Expository Teaching & Practical Truth</span>
          </h4>

          {/* Key Truth Highlight */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border-l-4 border-amber-500 text-sm font-semibold text-amber-200 leading-relaxed">
            💡 <strong>Key Truth:</strong> {activeLesson.keyTruth}
          </div>

          <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
            {activeLesson.commentary.map((para, idx) => (
              <p key={idx} className="font-normal">{para}</p>
            ))}
          </div>
        </div>

        {/* Student Homework & Guided Reflection */}
        <div className="space-y-6 pt-6 border-t border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="font-black text-white text-base flex items-center gap-2">
                <Feather className="w-4 h-4 text-amber-400" />
                <span>Student Work & Self-Examination</span>
              </h4>
              <p className="text-xs text-slate-400">
                Answer each question honestly. Your answers automatically save to your sanctuary database.
              </p>
            </div>
            {savingStatus === 'saved' && (
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1 self-start sm:self-auto">
                <Check className="w-3.5 h-3.5" /> Saved to Database
              </span>
            )}
          </div>

          <div className="space-y-6">
            {activeLesson.homeworkQuestions.map((q) => (
              <div key={q.id} className="space-y-2">
                <label className="block text-xs sm:text-sm font-bold text-slate-200">
                  {q.question}
                </label>
                {q.hint && (
                  <p className="text-[11px] text-amber-400/80 italic">{q.hint}</p>
                )}
                <textarea
                  rows={3}
                  value={answers[q.id] || ''}
                  onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                  placeholder="Type your personal reflection and conviction here..."
                  className="w-full p-3.5 rounded-2xl bg-white/5 border border-white/15 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 leading-relaxed font-sans"
                />
              </div>
            ))}
          </div>

          {/* Action Step & Prayer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">Weekly Action Step</span>
              <p className="text-xs text-slate-300 leading-relaxed">{activeLesson.weeklyActionStep}</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">Consecration Prayer</span>
              <p className="text-xs text-slate-300 italic leading-relaxed font-serif">"{activeLesson.prayer}"</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/10">
            <button
              onClick={() => handleSaveHomework(false)}
              className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-2 transition-all"
            >
              <Save className="w-4 h-4 text-amber-400" />
              <span>Save Progress Draft</span>
            </button>

            <button
              onClick={() => handleSaveHomework(true)}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-105 active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Mark Lesson {activeLesson.id} Complete & Claim Points</span>
            </button>
          </div>
        </div>
      </div>

      {/* Graduation Certificate Modal */}
      {showCertificateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-2xl w-full bg-slate-900 border-2 border-amber-500 rounded-3xl p-6 sm:p-10 text-center shadow-2xl relative space-y-6">
            <div className="space-y-2">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 flex items-center justify-center mx-auto shadow-xl shadow-amber-500/30">
                <Trophy className="w-8 h-8 fill-current" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-amber-400">Official Graduation</span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                RU Overcomer Certificate of Completion
              </h2>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Presented to a dedicated student of the Word who has completed all six lessons of The Overcomer Book.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-black/50 border border-white/10 space-y-4">
              <p className="text-xs text-slate-400 uppercase tracking-wider">This is to certify that</p>
              <h3 className="text-2xl font-black text-amber-300 font-serif">
                {user?.name || user?.handle || 'Tex / Faithful Believer'}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed max-w-lg mx-auto">
                Has faithfully completed The Overcomer Book (Book 1) curriculum of Reformers Unanimous, mastering the 10 Spiritual Principles of recovery through our Lord and Saviour Jesus Christ.
              </p>
              <div className="pt-2 flex items-center justify-center gap-2 text-xs font-bold text-emerald-400">
                <span>"Nay, in all these things we are more than conquerors through him that loved us." — Romans 8:37</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  soundEffects.playTap();
                  window.print();
                }}
                className="px-5 py-3 rounded-2xl bg-amber-500 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg"
              >
                <Download className="w-4 h-4" />
                <span>Print Certificate</span>
              </button>
              <button
                onClick={() => setShowCertificateModal(false)}
                className="px-5 py-3 rounded-2xl bg-white/10 text-white font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
