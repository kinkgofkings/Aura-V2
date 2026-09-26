import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Mail, AlertTriangle } from 'lucide-react';

export const UnverifiedBanner: React.FC = () => {
  const { user, sendVerificationEmail } = useAuth();
  const [sent, setSent] = React.useState(false);

  if (!user || user.isVerified) return null;

  return (
    <div className="w-full bg-amber-500/10 border-b border-amber-500/20 py-2 px-4 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm z-50 relative pt-safe">
      <div className="flex items-center gap-2 text-amber-400">
        <AlertTriangle className="w-4 h-4" />
        <span className="font-medium">Your account is unverified. Please check your email.</span>
      </div>
      <button 
        onClick={async () => {
          await sendVerificationEmail();
          setSent(true);
        }}
        disabled={sent}
        className="px-3 py-1 bg-amber-500 text-black font-bold rounded-lg hover:bg-amber-400 transition-colors disabled:opacity-50"
      >
        {sent ? 'Sent!' : 'Resend Email'}
      </button>
    </div>
  );
};
