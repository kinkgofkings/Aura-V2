import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Shield,
  Heart,
  Flame,
  Sun,
  BookOpen,
  Volume2,
  RefreshCw,
  ChevronRight,
  Radio,
  Users,
  Compass
} from 'lucide-react';
import { soundEffects } from '../../services/audio';

interface MatrixSplashScreenProps {
  onEnter: () => void;
}

type GraphicTheme = 'custom' | 'lion' | 'dove' | 'prayer' | 'cross';

interface ScriptureItem {
  reference: string;
  theme: string;
  verse: string;
  context: string;
}

const SCRIPTURES_FOR_THE_BROKEN: ScriptureItem[] = [
  {
    reference: 'Luke 19:10',
    theme: 'Saving the Lost',
    verse: 'For the Son of man is come to seek and to save that which was lost.',
    context: 'No soul is too far gone, too damaged, or too forgotten for Jesus Christ to redeem.',
  },
  {
    reference: 'Psalm 34:18',
    theme: 'Healing the Brokenhearted',
    verse: 'The LORD is nigh unto them that are of a broken heart; and saveth such as be of a contrite spirit.',
    context: 'When you feel completely broken inside, God is not distant—He is closer than ever.',
  },
  {
    reference: 'Matthew 11:28',
    theme: 'Rest for the Weary',
    verse: 'Come unto me, all ye that labour and are heavy laden, and I will give you rest.',
    context: 'Lay down your exhaustion, shame, and anxiety at the foot of the Cross.',
  },
  {
    reference: 'Isaiah 61:1',
    theme: 'Freedom for Captives',
    verse: 'He hath sent me to bind up the brokenhearted, to proclaim liberty to the captives, and opening of the prison to them that are bound.',
    context: 'Christ has broken every chain of addiction, depression, and despair.',
  },
  {
    reference: 'Psalm 147:3',
    theme: 'Binding Our Wounds',
    verse: 'He healeth the broken in heart, and bindeth up their wounds.',
    context: 'His hands are gentle enough to mend the deepest traumas and scars.',
  },
  {
    reference: 'Revelation 5:5',
    theme: 'The Lion Triumphed',
    verse: 'Weep not: behold, the Lion of the tribe of Juda, the Root of David, hath prevailed.',
    context: 'Our King has conquered sin, death, and darkness. In Him, we walk as overcomers.',
  },
];

const FAITH_TELEMETRY_LOGS = [
  'SANCTUARY NETWORK INITIALIZED // KING OF KINGS',
  'ARMOR OF GOD EQUIPPED [EPHESIANS 6:10-18]',
  'PRAYER WALL & INTERCESSION CHANNELS [ACTIVE]',
  'CHRIST-CENTERED RECOVERY // CHAINS BROKEN [CONFIRMED]',
  'TOUCH ANYWHERE TO ENTER THE SANCTUARY',
];

export const MatrixSplashScreen: React.FC<MatrixSplashScreenProps> = ({ onEnter }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isEntering, setIsEntering] = useState(false);
  const [touchCoordinates, setTouchCoordinates] = useState<{ x: number; y: number } | null>(null);
  const [scriptureIndex, setScriptureIndex] = useState(0);
  const [activeGraphic, setActiveGraphic] = useState<GraphicTheme>('custom');
  const [bootLogIndex, setBootLogIndex] = useState(0);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  // Progressive telemetry ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setBootLogIndex((prev) => (prev < FAITH_TELEMETRY_LOGS.length - 1 ? prev + 1 : prev));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  // Auto-cycle scriptures on saving the lost & broken
  useEffect(() => {
    const scriptureTimer = setInterval(() => {
      setScriptureIndex((prev) => (prev + 1) % SCRIPTURES_FOR_THE_BROKEN.length);
    }, 6500);
    return () => clearInterval(scriptureTimer);
  }, []);

  // Auto-cycle emblem graphics
  useEffect(() => {
    const graphicsSequence: GraphicTheme[] = ['custom', 'lion', 'dove', 'prayer', 'cross'];
    const graphicTimer = setInterval(() => {
      setActiveGraphic((current) => {
        const nextIndex = (graphicsSequence.indexOf(current) + 1) % graphicsSequence.length;
        return graphicsSequence[nextIndex];
      });
    }, 4500); // Change graphic every 4.5 seconds
    return () => clearInterval(graphicTimer);
  }, []);

  // Heavenly Light Rays & Ascending Golden Embers Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Light beam parameters
    const rayCount = 14;
    const rays: { angle: number; width: number; speed: number; opacity: number; phase: number }[] = [];
    for (let i = 0; i < rayCount; i++) {
      rays.push({
        angle: (i / rayCount - 0.5) * 1.6, // Spread across bottom
        width: 40 + Math.random() * 80,
        speed: 0.003 + Math.random() * 0.004,
        opacity: 0.12 + Math.random() * 0.22,
        phase: Math.random() * Math.PI * 2,
      });
    }

    // Floating golden prayer sparks / holy light embers
    interface Spark {
      x: number;
      y: number;
      size: number;
      vy: number;
      vx: number;
      alpha: number;
      maxAlpha: number;
      glow: string;
    }

    const sparks: Spark[] = Array.from({ length: 65 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: 1 + Math.random() * 3.5,
      vy: -(0.4 + Math.random() * 0.9),
      vx: (Math.random() - 0.5) * 0.5,
      alpha: Math.random() * 0.7,
      maxAlpha: 0.4 + Math.random() * 0.6,
      glow: Math.random() > 0.3 ? '#f59e0b' : '#fef08a',
    }));

    let time = 0;

    const render = () => {
      time += 0.02;

      // Deep celestial midnight background fade
      ctx.fillStyle = '#04060f';
      ctx.fillRect(0, 0, width, height);

      // Radial celestial glory from top-center
      const originX = width * 0.5;
      const originY = -40;

      const radialGrad = ctx.createRadialGradient(originX, originY, 20, originX, originY, height * 0.9);
      radialGrad.addColorStop(0, 'rgba(251, 191, 36, 0.35)');
      radialGrad.addColorStop(0.3, 'rgba(245, 158, 11, 0.15)');
      radialGrad.addColorStop(0.65, 'rgba(59, 130, 246, 0.08)');
      radialGrad.addColorStop(1, 'rgba(4, 6, 15, 0)');
      ctx.fillStyle = radialGrad;
      ctx.fillRect(0, 0, width, height);

      // Draw Volumetric Godrays / Light descending from Heaven
      ctx.save();
      ctx.globalCompositeOperation = 'screen';

      rays.forEach((ray) => {
        const pulse = Math.sin(time * ray.speed * 60 + ray.phase) * 0.08;
        const currentOpacity = Math.max(0.04, ray.opacity + pulse);

        ctx.beginPath();
        ctx.moveTo(originX, originY);

        const targetX = originX + Math.tan(ray.angle) * (height + 100);
        const halfWidth = ray.width * 0.5;

        ctx.lineTo(targetX - halfWidth, height);
        ctx.lineTo(targetX + halfWidth, height);
        ctx.closePath();

        const rayGrad = ctx.createLinearGradient(originX, originY, targetX, height);
        rayGrad.addColorStop(0, `rgba(255, 255, 255, ${currentOpacity * 1.5})`);
        rayGrad.addColorStop(0.25, `rgba(251, 191, 36, ${currentOpacity * 1.2})`);
        rayGrad.addColorStop(0.7, `rgba(245, 158, 11, ${currentOpacity * 0.5})`);
        rayGrad.addColorStop(1, 'rgba(4, 6, 15, 0)');

        ctx.fillStyle = rayGrad;
        ctx.fill();
      });

      ctx.restore();

      // Render Ascending Golden Embers & Prayer Sparks
      ctx.save();
      sparks.forEach((s) => {
        s.y += s.vy;
        s.x += s.vx + Math.sin(time + s.y * 0.01) * 0.3;

        if (s.y < -10) {
          s.y = height + 10;
          s.x = Math.random() * width;
        }

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = s.glow;
        ctx.shadowBlur = s.size * 5;
        ctx.shadowColor = s.glow;
        ctx.globalAlpha = s.maxAlpha * (0.6 + Math.sin(time * 2 + s.x) * 0.4);
        ctx.fill();
      });
      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleTriggerRoar = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsAudioPlaying(true);
    try {
      soundEffects.playLionRoarChime();
    } catch {}
    setTimeout(() => setIsAudioPlaying(false), 1400);
  };

  const handleTriggerEnter = (e?: React.MouseEvent | React.TouchEvent) => {
    if (isEntering) return;

    if (e && 'clientX' in e) {
      setTouchCoordinates({ x: e.clientX, y: e.clientY });
    } else if (e && 'touches' in e && e.touches[0]) {
      setTouchCoordinates({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }

    try {
      soundEffects.playHeavenlyChord();
    } catch {}

    setIsEntering(true);

    setTimeout(() => {
      onEnter();
    }, 750);
  };

  const currentScripture = SCRIPTURES_FOR_THE_BROKEN[scriptureIndex];

  return (
    <div
      id="christian-splash-screen"
      className="fixed inset-0 z-[100] bg-[#03040b] select-none flex flex-col items-center justify-between overflow-hidden"
    >
      {/* Background Volumetric Divine Light & Golden Embers Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Subtle Vignette & Holy Light Radial Glare */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(3,4,11,0.85)_85%)]" />

      {/* Top Header: Unmistakable Christian Identity & Quick Enter Button */}
      <div className="relative z-20 w-full max-w-4xl flex items-center justify-between px-3 sm:px-6 pt-[max(env(safe-area-inset-top),1.25rem)] sm:pt-[max(env(safe-area-inset-top),1.5rem)] border-b border-amber-500/20 pb-2.5 flex-shrink-0 bg-[#03040b]/90 backdrop-blur-md">
        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)] flex-shrink-0 overflow-hidden relative">
            <img
              src="/icon.png"
              alt="Aura Icon"
              className="w-full h-full object-cover rounded-xl absolute inset-0 z-10"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
            <span className="font-serif font-black text-base">✝</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xs sm:text-sm tracking-wider text-amber-300 font-mono truncate">
                AURA SANCTUARY
              </span>
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-200 border border-amber-500/30 text-[8px] sm:text-[9px] font-black uppercase tracking-widest hidden sm:inline">
                Christian Social Network
              </span>
            </div>
            <p className="text-[9px] sm:text-[10px] text-slate-400 font-medium truncate">Faith • Fellowship • Bible Study • Recovery</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="hidden sm:flex items-center gap-1 font-mono text-[10px] text-amber-300/80 px-2 py-1 rounded-lg bg-white/5 border border-white/10">
            <Shield className="w-3 h-3 text-amber-400 animate-pulse" />
            <span>ARMOR OF GOD:</span>
            <span className="text-white font-bold">EPH 6:11</span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleTriggerEnter(e);
            }}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-black tracking-wider uppercase flex items-center gap-1 transition-all active:scale-95 shadow-md shadow-amber-500/30"
          >
            <span>Enter</span>
            <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
          </button>
        </div>
      </div>

      {/* Main Centerpiece: Scrollable on Mobile so nothing is ever cut off */}
      <div className="relative z-10 w-full flex-1 overflow-y-auto overscroll-contain px-3 sm:px-6 py-3 sm:py-5 flex flex-col items-center [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="my-auto flex flex-col items-center text-center max-w-xl px-2 w-full space-y-3.5 sm:space-y-4">
        {/* Emblem Showcase: Lion of Judah, Holy Dove, Praying Hands, Calvary Cross */}
        <div className="relative group min-h-[160px] sm:min-h-[220px] flex items-center justify-center">
          {/* Celestial Halo & Radiant Beams */}
          <div className="absolute -inset-8 rounded-full bg-gradient-to-b from-amber-400/25 via-yellow-500/15 to-transparent blur-2xl animate-pulse pointer-events-none" />

          {/* Graphic Container with SVG Artwork or Custom Splash */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeGraphic}
              initial={{ scale: 0.85, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className={`relative ${
                activeGraphic === 'custom'
                  ? 'w-40 h-40 sm:w-52 sm:h-52'
                  : 'w-32 h-32 sm:w-40 sm:h-40'
              } rounded-3xl bg-black/60 backdrop-blur-2xl border-2 border-amber-400/50 flex flex-col items-center justify-center p-2.5 sm:p-3 shadow-[0_0_60px_rgba(245,158,11,0.45)] ring-1 ring-white/20 overflow-visible transition-all duration-300`}
            >
              {activeGraphic === 'custom' && (
                <div className="relative w-full h-full flex flex-col items-center justify-center rounded-2xl overflow-hidden">
                  <img
                    src="/splashscreen.png"
                    alt="Aura Sanctuary Splash"
                    className="w-full h-full object-contain drop-shadow-[0_0_25px_rgba(251,191,36,0.8)] filter transition-transform hover:scale-105"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/icon.png';
                    }}
                  />
                </div>
              )}

            {activeGraphic === 'lion' && (
              <div className="relative w-full h-full flex flex-col items-center justify-center rounded-2xl overflow-hidden p-2">
                <img 
                  src="/icon.png" 
                  alt="Lion of Judah"
                  className="w-full h-full object-contain drop-shadow-[0_0_20px_rgba(251,191,36,0.7)] transition-transform hover:scale-105"
                />
              </div>
            )}

            {activeGraphic === 'dove' && (
              <div className="relative w-full h-full flex flex-col items-center justify-center">
                {/* Descending Holy Spirit Dove SVG */}
                <svg
                  viewBox="0 0 100 100"
                  className="w-24 h-24 sm:w-32 sm:h-32 drop-shadow-[0_0_20px_rgba(255,255,255,0.9)]"
                >
                  <defs>
                    <linearGradient id="doveWhite" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#ffffff" />
                      <stop offset="60%" stopColor="#f8fafc" />
                      <stop offset="100%" stopColor="#94a3b8" />
                    </linearGradient>
                    <radialGradient id="haloGold">
                      <stop offset="0%" stopColor="rgba(251,191,36,0.6)" />
                      <stop offset="100%" stopColor="rgba(251,191,36,0)" />
                    </radialGradient>
                  </defs>
                  <circle cx="50" cy="46" r="28" fill="url(#haloGold)" />
                  {/* Spread Wings descending */}
                  <path
                    d="M 50 28 C 38 18 18 20 12 36 C 22 42 36 40 45 46 C 40 60 36 74 46 86 C 50 74 54 74 54 86 C 64 74 60 60 55 46 C 64 40 78 42 88 36 C 82 20 62 18 50 28 Z"
                    fill="url(#doveWhite)"
                  />
                  {/* Descending Dove Head */}
                  <circle cx="50" cy="48" r="7" fill="#ffffff" />
                  <polygon points="48,54 52,54 50,60" fill="#f59e0b" />
                  <circle cx="48" cy="47" r="1.2" fill="#0f172a" />
                </svg>
              </div>
            )}

            {activeGraphic === 'prayer' && (
              <div className="relative w-full h-full flex flex-col items-center justify-center">
                {/* Praying Hands of Mercy SVG */}
                <svg
                  viewBox="0 0 100 100"
                  className="w-24 h-24 sm:w-32 sm:h-32 drop-shadow-[0_0_20px_rgba(251,191,36,0.7)]"
                >
                  <defs>
                    <linearGradient id="handsGold" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#fef08a" />
                      <stop offset="50%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#b45309" />
                    </linearGradient>
                  </defs>
                  {/* Glowing light rays between hands */}
                  <line x1="50" y1="18" x2="50" y2="35" stroke="#fef08a" strokeWidth="2" strokeDasharray="3,3" />
                  <line x1="38" y1="24" x2="44" y2="38" stroke="#fef08a" strokeWidth="1.5" />
                  <line x1="62" y1="24" x2="56" y2="38" stroke="#fef08a" strokeWidth="1.5" />
                  {/* Praying Hands Clasp */}
                  <path
                    d="M 48 24 C 47 24 45 28 45 36 L 45 52 L 40 60 C 37 65 39 74 44 80 L 50 82 L 56 80 C 61 74 63 65 60 60 L 55 52 L 55 36 C 55 28 53 24 52 24 C 51 22 49 22 48 24 Z"
                    fill="url(#handsGold)"
                    stroke="#78350f"
                    strokeWidth="1.5"
                  />
                  {/* Sleeves & Robe */}
                  <path d="M 38 78 L 32 88 L 68 88 L 62 78 Z" fill="#334155" stroke="#64748b" strokeWidth="1" />
                </svg>
              </div>
            )}

            {activeGraphic === 'cross' && (
              <div className="relative w-full h-full flex flex-col items-center justify-center">
                {/* Calvary Cross of Light SVG */}
                <svg
                  viewBox="0 0 100 100"
                  className="w-24 h-24 sm:w-32 sm:h-32 drop-shadow-[0_0_24px_rgba(251,191,36,0.9)]"
                >
                  <defs>
                    <linearGradient id="crossGold" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ffffff" />
                      <stop offset="40%" stopColor="#fbbf24" />
                      <stop offset="100%" stopColor="#b45309" />
                    </linearGradient>
                  </defs>
                  {/* Radiant Sunburst behind cross */}
                  <circle cx="50" cy="40" r="18" fill="none" stroke="#fef08a" strokeWidth="1" opacity="0.6" strokeDasharray="4,3" />
                  {/* The Cross */}
                  <path
                    d="M 46 16 L 54 16 L 54 34 L 72 34 L 72 42 L 54 42 L 54 84 L 46 84 L 46 42 L 28 42 L 28 34 L 46 34 Z"
                    fill="url(#crossGold)"
                    stroke="#fef08a"
                    strokeWidth="1.5"
                  />
                </svg>
              </div>
            )}

            {/* Badass Emblem Title Badge */}
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-black font-black text-[11px] sm:text-xs tracking-wider uppercase shadow-xl flex items-center justify-center gap-1.5 whitespace-nowrap z-10 border border-amber-200">
              {activeGraphic === 'custom' && <span>✨ AURA SANCTUARY</span>}
              {activeGraphic === 'lion' && <span>🦁 LION OF JUDAH</span>}
              {activeGraphic === 'dove' && <span>🕊️ HOLY SPIRIT</span>}
              {activeGraphic === 'prayer' && <span>🙏 PRAYER & MERCY</span>}
              {activeGraphic === 'cross' && <span>✝️ CALVARY CROSS</span>}
            </div>
          </motion.div>
          </AnimatePresence>
        </div>

        {/* App Title & Mission Statement */}
        <div className="space-y-1.5 pt-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-black uppercase tracking-widest relative">
            <span>⚔️ AURA CHRISTIAN COMMUNITY ⚔️</span>
            {/* Embedded Sound Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleTriggerRoar();
              }}
              className="absolute -right-10 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-amber-500/20 text-amber-400 transition-colors"
              title="Hear the Roar"
            >
              <Volume2 className={`w-3.5 h-3.5 ${isAudioPlaying ? 'animate-bounce text-amber-300' : ''}`} />
            </button>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white drop-shadow-[0_0_30px_rgba(245,158,11,0.5)]">
            FELLOWSHIP & TRUTH
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
            A sanctuary for the broken, healed by grace. Walk in the Light, connect with believers, intercede on the
            Prayer Wall, and study the Living Word.
          </p>
        </div>

        {/* SCRIPTURE FOR THE LOST & BROKEN (Requested by User) */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            setScriptureIndex((prev) => (prev + 1) % SCRIPTURES_FOR_THE_BROKEN.length);
          }}
          className="w-full bg-slate-900/80 backdrop-blur-xl border border-amber-500/40 rounded-2xl p-4 text-left shadow-2xl relative overflow-hidden group hover:border-amber-400 transition-all"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-300">
                {currentScripture.theme}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
              <span className="text-amber-400 font-bold">{currentScripture.reference}</span>
              <RefreshCw className="w-3 h-3 text-slate-500 group-hover:rotate-180 transition-transform duration-500" />
            </div>
          </div>

          <p className="text-xs sm:text-sm font-serif italic text-white/95 leading-relaxed drop-shadow-sm">
            "{currentScripture.verse}"
          </p>

          <p className="text-[11px] text-amber-200/80 mt-2 font-medium">
            💡 {currentScripture.context}
          </p>

          <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500">
            <span>Tap verse to cycle promises</span>
            <span>{scriptureIndex + 1} of {SCRIPTURES_FOR_THE_BROKEN.length}</span>
          </div>
        </div>

        {/* Dynamic Telemetry Status Ticker */}
        <div className="w-full bg-black/60 backdrop-blur-md border border-white/10 rounded-xl px-3 py-2 text-left font-mono text-[10px] text-amber-300/80 space-y-1">
          {FAITH_TELEMETRY_LOGS.slice(0, bootLogIndex + 1).map((log, idx) => (
            <div key={idx} className="flex items-center gap-2 truncate">
              <span className="text-amber-500">✝</span>
              <span className={idx === bootLogIndex ? 'text-white font-bold animate-pulse' : 'opacity-70'}>
                {log}
              </span>
            </div>
          ))}
        </div>

        </div>
      </div>

      {/* Sticky Bottom Action Bar: Always visible on mobile, never cut off */}
      <div className="relative z-20 w-full max-w-xl px-4 pt-2.5 pb-4 sm:pb-5 bg-gradient-to-t from-[#03040b] via-[#03040b]/95 to-transparent flex-shrink-0 flex flex-col items-center gap-2 border-t border-amber-500/20 shadow-[0_-15px_30px_rgba(0,0,0,0.85)]">
        {/* Big Badass "TOUCH TO ENTER SANCTUARY" Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={(e) => {
            e.stopPropagation();
            handleTriggerEnter(e);
          }}
          id="enter-sanctuary-btn"
          className="group w-full py-3.5 sm:py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-yellow-300 text-black font-black text-sm sm:text-base tracking-widest uppercase shadow-[0_0_40px_rgba(245,158,11,0.7)] border-2 border-amber-200/90 flex items-center justify-center gap-3 transition-all cursor-pointer relative overflow-hidden active:scale-98"
        >
          <span className="absolute inset-0 bg-white/30 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          <span className="text-lg">✝</span>
          <span>ENTER THE SANCTUARY</span>
          <ChevronRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform stroke-[2.5]" />
        </motion.button>

        {/* Bottom Footer: Scripture Pillars & Community Badges */}
        <div className="w-full flex items-center justify-between text-slate-400 font-mono text-[9px] sm:text-[10px] px-1">
          <div className="flex items-center gap-2">
            <span>📖 KING JAMES BIBLE</span>
            <span>•</span>
            <span>🙏 PRAYER WALL</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-400 font-bold">
            <Shield className="w-3 h-3 text-amber-400" />
            <span>REVELATION 5:5</span>
            <span className="hidden sm:inline">• LION HAS PREVAILED</span>
          </div>
        </div>
      </div>

      {/* Heavenly Light Burst Expansion Animation on Enter */}
      <AnimatePresence>
        {isEntering && (
          <motion.div
            initial={{ scale: 0, opacity: 0.95 }}
            animate={{ scale: 50, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            style={{
              left: touchCoordinates?.x ?? '50%',
              top: touchCoordinates?.y ?? '50%',
            }}
            className="fixed w-20 h-20 -ml-10 -mt-10 rounded-full bg-gradient-to-tr from-amber-400 via-yellow-200 to-white shadow-[0_0_120px_white] pointer-events-none z-[110]"
          />
        )}
      </AnimatePresence>
    </div>
  );
};
