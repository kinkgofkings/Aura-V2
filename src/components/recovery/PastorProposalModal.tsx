import React, { useState, useRef } from 'react';
import { X, Copy, Check, Share2, Mail, MessageSquare, Sparkles } from 'lucide-react';

interface PastorProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PASTOR_PROPOSAL_TEXT = `Subject: A Gift for Your Ministry: The Aura App – Christ-Centered Recovery & Discipleship Platform

Dear Pastor,

I have long respected the vital, life-saving work your church does walking alongside individuals and families in recovery. Knowing the unique spiritual and daily battles people face when breaking free from addiction and hurt, I wanted to reach out and offer a fully built, Christ-centered digital platform called Aura as a 100% free gift to donate to your church community.

Aura was designed from the ground up to combine daily recovery accountability with deep biblical discipleship, giving members an anchor right in their pockets between Sunday services and weekly recovery meetings.

Here is an overview of what’s on the menu inside the app:

1. 🛡️ Faith-Based Recovery Dashboard & Sobriety Tools
• Milestone & Clean-Time Tracker: Celebrates clean days, key sobriety milestones, and spiritual victories with encouragement.
• Daily Check-Ins & Urge Surfing: Practical, in-the-moment spiritual breathing and coping tools when cravings, anxiety, or triggers hit.
• Recovery Journal & Gratitude Log: Dedicated spaces for personal honest reflection, step work, and cultivating a daily thankful heart.
• Crisis Hotline & Emergency Support: Immediate one-tap access to recovery and pastoral crisis helplines.
• Accountability Partner System: Connects members with sponsors, mentors, or church leaders to stay anchored and supported.

2. 📖 In-Depth Bible Study & Scripture Hub
• Full Scripture Reader (KJV & Multiple Versions): Clean, distraction-free Bible reading.
• Word Studies & Commentary: Built-in Strong’s Concordance and verse-by-verse breakdown to help recovering believers discover who they are in Christ.
• Interactive In-App Webview with Breadcrumbs: Seamlessly cross-reference passages on Bible Gateway or external study portals without ever losing their place or leaving the app.

3. 🎓 Discipleship LMS & Recovery Curriculum
• Structured Recovery & Expository Courses: Comes pre-loaded with comprehensive discipleship content, including "The Triumph of Grace: Romans Chapter 8" (a deep dive into freedom from condemnation, spiritual identity, and unshakeable security).
• Course Studio for Your Ministry: Church leaders and recovery pastors can easily build and upload your own customized classes, step studies, video teachings, sermon series, reflection questions, and companion study guides.
• Integrated Video, Audio & Study Notes: Embed video messages, audio sermons, and downloadable PDFs directly into lessons.

4. 🙏 Prayer Wall & Community Fellowship
• Real-Time Prayer Requests: Members can post prayer needs for sobriety, family healing, and personal struggles.
• Intercession Counters: Allows the congregation to tap "I Prayed for You," letting vulnerable members visually see that they are never alone.
• Testimonies of Freedom: A dedicated space to share praise reports and how God has worked in their recovery journey.

5. 🎙️ Live Sermon & Podcast Media Hub
• Sermon Streaming & Archives: Direct hub for your church’s live sermons, worship gatherings, and recovery speaker meetings.
• Podcast & Audio Library: Curate uplifting recovery messages, testimonies, and discipleship teachings for members to listen to on their daily commutes.

6. 🌅 Daily Devotionals & Habit Building
• Morning & Evening Devotions: Scripture-centered devotionals focused on grace, humility, overcoming temptation, and spiritual resilience.
• Devotional Notifications & Streaks: Gentle daily notifications encouraging members to build consistent habits with God’s Word.

---
Why I Would Like to Donate This to Your Church:
Recovery is a daily, moment-by-moment journey. Many who come through church doors need accessible, Christ-centered tools when they are home alone at night, facing a tough day at work, or looking for community support during the week. 

There are no fees, no subscriptions, and no advertisements. It is my prayer that this platform serves as an extension of your church’s heart, helping you disciple, encourage, and walk with people all the way into lasting freedom.

You can explore and test the platform directly here:
👉 https://webcraftstudio.cloud/

I would love to set up a brief time to walk you or your recovery ministry team through the app, answer any questions, and help configure it with your church's own lessons and materials.

With gratitude and in Christ’s service,

James Coffman
Phone: (826) 255-0831
Email: savdbygrace360@gmail.com
Website: https://webcraftstudio.cloud/`;

export const PastorProposalModal: React.FC<PastorProposalModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  if (!isOpen) return null;

  const handleCopy = () => {
    let success = false;
    try {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.select();
        textareaRef.current.setSelectionRange(0, 99999);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(PASTOR_PROPOSAL_TEXT);
        success = true;
      }
    } catch {
      // Fallback to document.execCommand
    }

    if (!success && typeof document !== 'undefined') {
      try {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.select();
        }
        document.execCommand('copy');
        success = true;
      } catch {}
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSelectAll = () => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
      textareaRef.current.setSelectionRange(0, 99999);
    }
  };

  const handleEmail = () => {
    const subject = encodeURIComponent('A Gift for Your Ministry: The Aura App – Christ-Centered Recovery Platform');
    const body = encodeURIComponent(PASTOR_PROPOSAL_TEXT);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleSMS = () => {
    const text = encodeURIComponent(
      `Hi Pastor, I'd like to donate a Christ-centered Recovery & Discipleship App called Aura to our church. Check it out at https://webcraftstudio.cloud/ - James Coffman (826) 255-0831`
    );
    window.location.href = `sms:?body=${text}`;
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Aura App - Pastor & Recovery Church Donation Proposal',
          text: PASTOR_PROPOSAL_TEXT,
          url: 'https://webcraftstudio.cloud/',
        });
      } catch (err) {
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-2.5 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-amber-500/30 rounded-3xl w-full max-w-2xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-3.5 sm:p-5 border-b border-white/10 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white leading-tight">
                Church Donation Proposal
              </h3>
              <p className="text-[11px] sm:text-xs text-amber-400 font-medium">
                1-Tap Copy & Share for Pastors / Recovery Leaders
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Buttons Bar */}
        <div className="p-2.5 sm:p-3.5 bg-amber-950/30 border-b border-amber-500/20 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className={`flex-1 min-w-[130px] py-2.5 px-3 sm:px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 cursor-pointer ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Tap to Copy All</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleSelectAll}
            className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 text-slate-200 text-xs font-semibold transition-all cursor-pointer"
            title="Highlight all text"
          >
            <span>Highlight All</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="py-2.5 px-3 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 active:scale-95 text-sky-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all border border-sky-500/30 cursor-pointer"
            title="Share via Text or Messages"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>

          <button
            type="button"
            onClick={handleSMS}
            className="py-2.5 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 active:scale-95 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all border border-emerald-500/30 cursor-pointer"
            title="Send Quick SMS text"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>SMS Text</span>
          </button>

          <button
            type="button"
            onClick={handleEmail}
            className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            title="Open in Email App"
          >
            <Mail className="w-3.5 h-3.5 text-amber-400" />
            <span>Email</span>
          </button>
        </div>

        {/* Selectable Textarea Preview */}
        <div className="flex-1 p-3 sm:p-4 bg-black/50 overflow-hidden flex flex-col">
          <textarea
            ref={textareaRef}
            readOnly
            value={PASTOR_PROPOSAL_TEXT}
            onClick={handleSelectAll}
            className="w-full h-full min-h-[220px] bg-slate-950/80 text-slate-200 border border-white/10 rounded-2xl p-3 sm:p-4 font-mono text-xs sm:text-sm leading-relaxed resize-none focus:outline-none focus:border-amber-500/50 select-all"
            placeholder="Loading proposal text..."
          />
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 flex items-center justify-between text-xs text-slate-400 border-t border-white/10">
          <span className="truncate pr-2">James Coffman • (826) 255-0831</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
