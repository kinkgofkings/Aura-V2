import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, LogIn, UserPlus, ShieldCheck, AlertCircle, Phone, Mail, Key } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getDailyQuote } from '../../content/quotes';
import { soundEffects } from '../../services/audio';

interface AuthModalProps {
  isOpen?: boolean;
  onClose: () => void;
  initialMode?: 'signup' | 'login' | 'phone';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'signup' }) => {
  const { 
    registerWithEmail, loginWithEmail, loginAsGuest, loginAsAdminTex,
    signInWithGoogle, signInWithFacebook, signInWithGithub, sendVerificationEmail, 
    resetPassword, setupRecaptcha, sendPhoneCode, verifyPhoneCode 
  } = useAuth();
  
  const dailyQuote = getDailyQuote();

  const [mode, setMode] = useState<'signup' | 'login' | 'phone' | 'verify' | 'forgot'>('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setErrorMessage(null);
      setSuccessMessage(null);
      if (initialMode === 'phone') {
        setTimeout(() => setupRecaptcha('recaptcha-container'), 500);
      }
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!name.trim() || !email.trim() || !username.trim() || !password.trim()) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    const result = await registerWithEmail(email.trim(), username.trim(), password, name.trim());
    if (result.success) {
      onClose();
    } else {
      setErrorMessage(result.error || 'Registration failed.');
    }
    setIsSubmitting(false);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter email and password.');
      return;
    }

    setIsSubmitting(true);
    const result = await loginWithEmail(email.trim(), password);
    if (result.success) {
      onClose();
    } else {
      setErrorMessage(result.error || 'Login failed.');
    }
    setIsSubmitting(false);
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);
    const result = await sendPhoneCode(phone);
    if (result.success) {
      setMode('verify'); // reuse verify mode for OTP input
      setSuccessMessage('Code sent to your phone!');
    } else {
      setErrorMessage(result.error || 'Failed to send code.');
    }
    setIsSubmitting(false);
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);
    const result = await verifyPhoneCode(otpCode);
    if (result.success) {
      onClose();
    } else {
      setErrorMessage(result.error || 'Invalid code.');
    }
    setIsSubmitting(false);
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);
    const result = await resetPassword(email);
    if (result.success) {
      setSuccessMessage('Password reset email sent! Check your inbox.');
      setTimeout(() => setMode('login'), 3000);
    } else {
      setErrorMessage(result.error || 'Failed to send reset email.');
    }
    setIsSubmitting(false);
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook' | 'github') => {
    soundEffects.playTap();
    setErrorMessage(null);
    setIsSubmitting(true);
    let result;
    if (provider === 'google') result = await signInWithGoogle();
    else if (provider === 'facebook') result = await signInWithFacebook();
    else if (provider === 'github') result = await signInWithGithub();
    
    if (result?.success) {
      onClose();
    } else {
      setErrorMessage(result?.error || `${provider} login failed.`);
    }
    setIsSubmitting(false);
  };

  const handleGuestLogin = async () => {
    soundEffects.playTap();
    setErrorMessage(null);
    setIsSubmitting(true);
    const result = await loginAsGuest();
    if (result.success) {
      onClose();
    } else {
      setErrorMessage(result.error || 'Guest login failed.');
    }
    setIsSubmitting(false);
  };

  const handleAdminTexLogin = async () => {
    soundEffects.playTap();
    setErrorMessage(null);
    setIsSubmitting(true);
    const result = await loginAsAdminTex();
    if (result.success) {
      onClose();
    } else {
      setErrorMessage(result.error || 'Admin login failed.');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-[#03040b]/90 backdrop-blur-xl"
        onClick={onClose}
      />
      
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative w-full max-w-md max-h-[90dvh] overflow-y-auto glass-card rounded-3xl shadow-2xl border border-white/10"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/70 transition-colors z-20"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8">
          <div className="text-center mb-5 sm:mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-600/20 flex items-center justify-center mx-auto mb-4 border border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
              <Sparkles className="w-8 h-8 text-amber-400" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2 tracking-tight">
              {mode === 'signup' && 'Join the Sanctuary'}
              {mode === 'login' && 'Welcome Back'}
              {mode === 'phone' && 'Phone Login'}
              {mode === 'verify' && (phone ? 'Enter Code' : 'Verify Email')}
              {mode === 'forgot' && 'Reset Password'}
            </h2>
            <p className="text-slate-400 text-sm">
              {mode === 'signup' && 'Create your account to connect with believers.'}
              {mode === 'login' && 'Enter your credentials to continue.'}
              {mode === 'phone' && 'We will send a code to your phone.'}
              {mode === 'verify' && (phone ? 'Enter the 6-digit code we sent.' : 'We sent a verification link to your email.')}
              {mode === 'forgot' && 'Enter your email to receive a reset link.'}
            </p>
          </div>

          {/* Top Mode Switcher: Create Account vs Sign In */}
          <div className="p-1 bg-white/5 border border-white/10 rounded-2xl flex gap-1 mb-6">
            <button
              type="button"
              id="auth-toggle-signup"
              onClick={() => {
                soundEffects.playTap();
                setMode('signup');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                mode === 'signup'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Account</span>
            </button>
            <button
              type="button"
              id="auth-toggle-login"
              onClick={() => {
                soundEffects.playTap();
                setMode('login');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                mode === 'login'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </button>
          </div>

          {errorMessage && (
            <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start justify-between gap-2 text-red-400 text-sm">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <p>{errorMessage}</p>
              </div>
              <button 
                type="button" 
                onClick={() => setErrorMessage(null)} 
                className="text-red-400 hover:text-white p-0.5 rounded transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-3 rounded-xl bg-green-500/10 border border-green-500/20 flex items-start gap-2 text-green-400 text-sm">
              <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" />
              <p>{successMessage}</p>
            </div>
          )}

          <div id="recaptcha-container" className="flex justify-center mb-4"></div>

          <AnimatePresence mode="wait">
            {mode === 'signup' && (
              <motion.form key="signup" onSubmit={handleSignupSubmit} className="space-y-4">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                />
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold rounded-xl hover:from-amber-400 hover:to-amber-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <UserPlus className="w-5 h-5" />
                  Create Account
                </button>
              </motion.form>
            )}

            {mode === 'login' && (
              <motion.form key="login" onSubmit={handleLoginSubmit} className="space-y-4">
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                />
                <div className="flex justify-end">
                  <button type="button" onClick={() => setMode('forgot')} className="text-xs text-amber-400 hover:text-amber-300">
                    Forgot password?
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold rounded-xl hover:from-amber-400 hover:to-amber-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <LogIn className="w-5 h-5" />
                  Sign In
                </button>
              </motion.form>
            )}

            {mode === 'phone' && (
              <motion.form key="phone" onSubmit={handlePhoneSubmit} className="space-y-4">
                <input
                  type="tel"
                  placeholder="Phone Number (e.g. +1234567890)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold rounded-xl hover:from-amber-400 hover:to-amber-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Phone className="w-5 h-5" />
                  Send Code
                </button>
              </motion.form>
            )}

            {mode === 'verify' && (
              <motion.div key="verify" className="space-y-4 text-center">
                {phone ? (
                  <form onSubmit={handleOtpSubmit} className="space-y-4">
                    <input
                      type="text"
                      placeholder="6-digit code"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      maxLength={6}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-center text-2xl tracking-widest focus:outline-none focus:border-amber-500/50"
                    />
                    <button
                      type="submit"
                      disabled={isSubmitting || otpCode.length !== 6}
                      className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold rounded-xl hover:from-amber-400 hover:to-amber-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <ShieldCheck className="w-5 h-5" />
                      Verify Code
                    </button>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <button
                      onClick={async () => {
                        setIsSubmitting(true);
                        await sendVerificationEmail();
                        setSuccessMessage("Verification email resent!");
                        setIsSubmitting(false);
                      }}
                      disabled={isSubmitting}
                      className="w-full py-3.5 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Mail className="w-5 h-5" />
                      Resend Email
                    </button>
                    <button
                      onClick={() => setMode('login')}
                      className="text-sm text-amber-400 hover:text-amber-300"
                    >
                      I have verified my email
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {mode === 'forgot' && (
              <motion.form key="forgot" onSubmit={handleForgotSubmit} className="space-y-4">
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold rounded-xl hover:from-amber-400 hover:to-amber-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Key className="w-5 h-5" />
                  Reset Password
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          {(mode === 'login' || mode === 'signup') && (
            <>
              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Or continue with</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              <div className="mb-4">
                <button
                  type="button"
                  onClick={() => handleSocialLogin('google')}
                  disabled={isSubmitting}
                  className="w-full py-3 bg-white text-slate-900 font-semibold rounded-xl hover:bg-slate-100 active:scale-[0.99] transition-all text-sm flex items-center justify-center gap-3 shadow-sm disabled:opacity-50"
                >
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                  </svg>
                  Continue with Google
                </button>
              </div>

              <div className="space-y-2 mb-5">
                <button
                  type="button"
                  onClick={handleGuestLogin}
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500/15 via-yellow-500/20 to-amber-500/15 hover:from-amber-500/25 hover:to-yellow-500/25 text-amber-300 font-semibold rounded-xl border border-amber-500/30 active:scale-[0.99] transition-all text-sm flex items-center justify-center gap-2.5 shadow-sm"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Instant Believer Access (Enter Sanctuary Now)
                </button>

                <button
                  type="button"
                  onClick={handleAdminTexLogin}
                  disabled={isSubmitting}
                  className="w-full py-2 px-3 bg-purple-950/40 hover:bg-purple-900/50 text-purple-300 hover:text-purple-200 font-medium rounded-xl border border-purple-500/30 active:scale-[0.99] transition-all text-xs flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                  Fast Admin Sign In (Tex)
                </button>
              </div>

              {/* Providers commented out until configured in Firebase Console credentials:
              <div className="grid grid-cols-2 gap-3 mb-3">
                <button
                  onClick={() => handleSocialLogin('facebook')}
                  disabled={isSubmitting}
                  className="py-2.5 bg-[#1877F2] text-white font-bold rounded-xl hover:bg-[#1877F2]/90 transition-all text-sm flex items-center justify-center gap-2"
                >
                  Facebook
                </button>
                <button
                  onClick={() => handleSocialLogin('github')}
                  disabled={isSubmitting}
                  className="py-2.5 bg-[#24292F] text-white font-bold rounded-xl hover:bg-[#24292F]/90 transition-all text-sm flex items-center justify-center gap-2"
                >
                  GitHub
                </button>
                <button
                  disabled={isSubmitting}
                  className="py-2.5 bg-[#010101] text-white font-bold border border-white/20 rounded-xl hover:bg-[#010101]/80 transition-all text-sm flex items-center justify-center gap-2"
                >
                  TikTok
                </button>
              </div>
              <button
                onClick={() => { setMode('phone'); setTimeout(() => setupRecaptcha('recaptcha-container'), 500); }}
                className="w-full py-2.5 bg-white/5 border border-white/10 text-white font-bold rounded-xl hover:bg-white/10 transition-all text-sm flex items-center justify-center gap-2 mb-6"
              >
                <Phone className="w-4 h-4" /> Phone Number
              </button>
              */}

              <div className="text-center">
                <button
                  onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                  className="text-sm text-slate-400 hover:text-white transition-colors"
                >
                  {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                </button>
              </div>
            </>
          )}

          {(mode === 'phone' || mode === 'verify' || mode === 'forgot') && (
            <div className="mt-6 text-center">
              <button
                onClick={() => setMode('login')}
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                Back to Sign In
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
