import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cross, Heart, Users, Sparkles, BookOpen, ChevronRight, X, ArrowRight, ShieldCheck } from 'lucide-react';
import { soundEffects } from '../../services/audio';
import { useAuth } from '../../context/AuthContext';

interface GospelTractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSignUp: () => void;
}

export const GospelTractModal: React.FC<GospelTractModalProps> = ({ isOpen, onClose, onOpenSignUp }) => {
  const [step, setStep] = useState(1);
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      try {
        soundEffects.playHeavenlyChord?.();
      } catch {}
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleNextStep = () => {
    try {
      soundEffects.playTap();
    } catch {}
    if (step < 4) {
      setStep(step + 1);
    }
  };

  const handleSavedClick = () => {
    try {
      soundEffects.playSuccessTone();
    } catch {}
    
    // Store that we have seen it
    try {
      localStorage.setItem('aura_gospel_seen', 'true');
    } catch {}
    onClose();
  };

  const handleWantToBeSavedClick = () => {
    try {
      soundEffects.playTap();
    } catch {}
    setStep(5); // Go to Salvation Prayer step
  };

  const handleAcceptSalvation = () => {
    try {
      soundEffects.playLevelUp();
    } catch {}
    
    // Mark as seen and prompt to join community
    try {
      localStorage.setItem('aura_gospel_seen', 'true');
    } catch {}
    
    if (!user) {
      onClose();
      onOpenSignUp();
    } else {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
        {/* Deep celestial midnight background fade */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-[#03040b]/95 backdrop-blur-2xl"
          onClick={() => {
            // Do not close on click outside for onboarding!
          }}
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-slate-900/90 backdrop-blur-md border border-amber-500/30 rounded-3xl shadow-[0_0_80px_rgba(245,158,11,0.2)] overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Decorative glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-amber-500/20 blur-[60px] pointer-events-none rounded-full" />
          
          {/* Header */}
          <div className="relative p-6 flex flex-col items-center text-center border-b border-amber-500/10">
            {(user && !!localStorage.getItem('aura_gospel_seen')) && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            
            <div className="w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400 mb-4 shadow-[0_0_20px_rgba(245,158,11,0.2)] ring-1 ring-amber-500/30">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <h2 className="text-2xl font-black text-white font-serif tracking-tight">The Greatest News</h2>
            <p className="text-sm font-medium text-amber-200/80 mt-1 uppercase tracking-widest font-mono">A Message of Hope and Truth</p>
          </div>

          {/* Content Area */}
          <div className="relative flex-1 overflow-y-auto p-6 scrollbar-hide">
            
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step-1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-5 text-center"
                >
                  <div className="w-16 h-16 mx-auto rounded-full bg-white/5 flex items-center justify-center text-slate-300">
                    <Heart className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-white">God Loves You</h3>
                  <p className="text-slate-300 text-sm leading-relaxed px-4">
                    Before you were even born, God knew you and loved you perfectly. He created you with a purpose and desires a relationship with you.
                  </p>
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <p className="text-amber-300 font-serif italic text-sm">"For God so loved the world, that he gave his only begotten Son..."</p>
                    <p className="text-[10px] text-amber-200/60 mt-1 uppercase font-bold tracking-widest">- John 3:16</p>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step-2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-5 text-center"
                >
                  <div className="w-16 h-16 mx-auto rounded-full bg-white/5 flex items-center justify-center text-slate-300">
                    <div className="text-2xl font-black font-serif">!</div>
                  </div>
                  <h3 className="text-xl font-bold text-white">The Separation</h3>
                  <p className="text-slate-300 text-sm leading-relaxed px-4">
                    But there is a problem. We have all sinned and fallen short. Our sin creates a barrier between us and a perfectly holy God. We cannot fix this on our own.
                  </p>
                  <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
                    <p className="text-rose-300 font-serif italic text-sm">"For all have sinned, and come short of the glory of God;"</p>
                    <p className="text-[10px] text-rose-200/60 mt-1 uppercase font-bold tracking-widest">- Romans 3:23</p>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step-3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-5 text-center"
                >
                  <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400">
                    <Cross className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-white">The Rescue Mission</h3>
                  <p className="text-slate-300 text-sm leading-relaxed px-4">
                    Because He loves us, God sent Jesus Christ. Jesus lived a perfect life, died on the cross to pay the penalty for our sins, and rose from the grave to conquer death!
                  </p>
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <p className="text-amber-300 font-serif italic text-sm">"But God commendeth his love toward us, in that, while we were yet sinners, Christ died for us."</p>
                    <p className="text-[10px] text-amber-200/60 mt-1 uppercase font-bold tracking-widest">- Romans 5:8</p>
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div
                  key="step-4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6 text-center"
                >
                  <div className="w-16 h-16 mx-auto rounded-full bg-white/5 flex items-center justify-center text-slate-300">
                    <BookOpen className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Your Response</h3>
                  <p className="text-slate-300 text-sm leading-relaxed px-4">
                    Salvation is a free gift. You cannot earn it. You simply need to believe in Jesus, repent of your sins, and receive Him as your Lord and Savior.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <button
                      onClick={handleWantToBeSavedClick}
                      className="p-4 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold flex flex-col items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg"
                    >
                      <Heart className="w-6 h-6" />
                      <span>I want to be saved!</span>
                    </button>
                    
                    <button
                      onClick={handleSavedClick}
                      className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold flex flex-col items-center justify-center gap-2 transition-transform active:scale-95"
                    >
                      <ShieldCheck className="w-6 h-6 text-emerald-400" />
                      <span>I am already saved</span>
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 5 && (
                <motion.div
                  key="step-5"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-5 text-center"
                >
                  <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Prayer of Salvation</h3>
                  <p className="text-slate-300 text-sm leading-relaxed px-4">
                    If you are ready to receive Jesus, you can pray something like this right now from your heart:
                  </p>
                  
                  <div className="p-5 rounded-2xl bg-black/40 border border-white/10 text-left relative">
                    <div className="absolute top-4 left-4 text-3xl text-amber-500/20 font-serif">"</div>
                    <p className="text-white/90 text-sm font-medium leading-relaxed relative z-10 pl-6">
                      Dear Lord Jesus, I know that I am a sinner, and I ask for Your forgiveness. I believe You died for my sins and rose from the dead. I turn from my sins and invite You to come into my heart and life. I want to trust and follow You as my Lord and Savior. In Your Name. Amen.
                    </p>
                  </div>
                  
                  <button
                    onClick={handleAcceptSalvation}
                    className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-lg flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg shadow-emerald-500/25 mt-4"
                  >
                    <span>I prayed this prayer!</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

          </div>

          {/* Footer Controls (for steps 1-3) */}
          {step < 4 && (
            <div className="p-6 bg-black/20 border-t border-white/5 flex items-center justify-between">
              <div className="flex gap-1.5">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === step ? 'w-6 bg-amber-500' : 'w-2 bg-white/20'
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={handleNextStep}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm transition-colors active:scale-95"
              >
                <span>Continue</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
