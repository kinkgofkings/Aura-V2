import React, { useState, useEffect } from 'react';
import {
  Heart,
  CreditCard,
  CheckCircle2,
  Lock,
  ExternalLink,
  Settings,
  Sparkles,
  X,
  Copy,
  Check,
  Shield,
  FileText,
  DollarSign,
  ArrowRight,
  Info
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { soundEffects } from '../../services/audio';
import { DonationRecord, GivingConfig } from '../../types/workbook';

interface GivingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_AMOUNTS = [10, 25, 50, 100, 250];

const DESIGNATIONS = [
  'General Ministry & App Maintenance',
  'Overcomer Workbooks & Student Bibles',
  'Community Outreach & Fellowship Meals',
  'Benevolence & Urgent Needs Fund'
];

export const GivingModal: React.FC<GivingModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  const isTexAdmin =
    user?.role === 'admin' ||
    user?.isAdmin ||
    user?.handle?.toLowerCase() === 'tex' ||
    user?.email?.toLowerCase().includes('lightsouttattootex') ||
    user?.email?.toLowerCase().includes('tex@aura.social');

  const [activeTab, setActiveTab] = useState<'give' | 'receipts' | 'admin'>('give');
  const [paymentMethod, setPaymentMethod] = useState<'square_card' | 'cash_app'>('square_card');
  const [frequency, setFrequency] = useState<'one_time' | 'monthly'>('one_time');
  const [selectedAmount, setSelectedAmount] = useState<number>(50);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [designation, setDesignation] = useState<string>(DESIGNATIONS[0]);
  const [donorName, setDonorName] = useState<string>(user?.name || '');
  const [donorEmail, setDonorEmail] = useState<string>(user?.email || '');
  const [note, setNote] = useState<string>('');

  // Square Card details
  const [cardNumber, setCardNumber] = useState('');
  const [cardExp, setCardExp] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardZip, setCardZip] = useState('');
  const [cardName, setCardName] = useState(user?.name || '');

  // Status & Receipts
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successDonation, setSuccessDonation] = useState<DonationRecord | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recentDonations, setRecentDonations] = useState<DonationRecord[]>([]);

  // Giving Config
  const [config, setConfig] = useState<GivingConfig>({
    ministryName: 'Aura Sanctuary & Recovery Ministries',
    taxExemptNotice: 'Thank you for your generous kingdom support. "God loveth a cheerful giver." (2 Cor 9:7)',
    cashAppCashtag: '$AuraSanctuary',
    squareAppId: 'sandbox-sq0idb-AuraMinistryLive',
    squareLocationId: 'L8J4V9W2G0'
  });
  const [copiedCashtag, setCopiedCashtag] = useState(false);
  const [configSaveSuccess, setConfigSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchConfig();
      fetchDonations();
      if (user) {
        if (!donorName) setDonorName(user.name || '');
        if (!donorEmail) setDonorEmail(user.email || '');
        if (!cardName) setCardName(user.name || '');
      }
    }
  }, [isOpen, user]);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/donations/config');
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch (e) {
      console.warn('Could not load giving config', e);
    }
  };

  const fetchDonations = async () => {
    try {
      const res = await fetch('/api/donations/history');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.donations)) {
          setRecentDonations(data.donations);
        }
      }
    } catch (e) {
      console.warn('Could not load donation history', e);
    }
  };

  if (!isOpen) return null;

  const currentAmount = isCustom ? parseFloat(customAmount) || 0 : selectedAmount;

  // Format Card Number (XXXX XXXX XXXX XXXX)
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  // Format Expiration (MM/YY)
  const handleExpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      raw = `${raw.slice(0, 2)}/${raw.slice(2)}`;
    }
    setCardExp(raw);
  };

  const handleSubmitDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (currentAmount <= 0) {
      setErrorMessage('Please enter a valid gift amount.');
      return;
    }

    if (paymentMethod === 'square_card') {
      const cleanNum = cardNumber.replace(/\s/g, '');
      if (cleanNum.length < 15) {
        setErrorMessage('Please enter a valid 16-digit credit or debit card number.');
        return;
      }
      if (cardExp.length < 5) {
        setErrorMessage('Please enter card expiration date (MM/YY).');
        return;
      }
      if (cardCvv.length < 3) {
        setErrorMessage('Please enter 3 or 4 digit CVV.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const last4 = cardNumber ? cardNumber.replace(/\s/g, '').slice(-4) : '4242';
      const res = await fetch('/api/donations/square', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          donorName: donorName || 'Anonymous Believer',
          donorEmail: donorEmail || 'donor@aura.social',
          amount: currentAmount,
          designation,
          frequency,
          paymentMethod,
          cardLast4: last4,
          cardBrand: 'Visa / Square Protected',
          note: note.trim() || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Donation could not be processed');
      }

      soundEffects.playLikeSparkle();
      setSuccessDonation(data.donation);
      fetchDonations();
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment failed. Please verify your card details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/donations/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      if (res.ok) {
        setConfigSaveSuccess(true);
        setTimeout(() => setConfigSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyCashtag = () => {
    const tag = config.cashAppCashtag || '$AuraSanctuary';
    navigator.clipboard.writeText(tag);
    setCopiedCashtag(true);
    setTimeout(() => setCopiedCashtag(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-xl bg-[#090b17] border border-amber-500/30 rounded-3xl shadow-2xl shadow-amber-500/10 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4 bg-gradient-to-b from-amber-950/40 via-amber-900/10 to-transparent border-b border-white/10">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-500 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/30">
              <Heart className="w-5 h-5 fill-slate-950" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-wide flex items-center gap-2">
                Kingdom Giving & Support <span className="text-amber-400">🙏</span>
              </h2>
              <p className="text-xs text-amber-300/80 font-medium">
                {config.ministryName}
              </p>
            </div>
          </div>

          <div className="mt-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200 leading-relaxed italic">
            "Every man according as he purposeth in his heart, so let him give; not grudgingly, or of necessity: for God loveth a cheerful giver." — 2 Corinthians 9:7
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-4 pt-2 border-t border-white/5 text-xs font-bold">
            <button
              onClick={() => setActiveTab('give')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                activeTab === 'give'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Give Now
            </button>
            <button
              onClick={() => setActiveTab('receipts')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                activeTab === 'receipts'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Recent Gifts & Receipts
            </button>
            {isTexAdmin && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`ml-auto flex items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
                  activeTab === 'admin'
                    ? 'bg-amber-600 text-white shadow-md font-black'
                    : 'text-amber-400 hover:text-white hover:bg-amber-500/10'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Admin Setup</span>
              </button>
            )}
          </div>
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-sm">
          {/* TAB 1: GIVE NOW */}
          {activeTab === 'give' && (
            <>
              {successDonation ? (
                /* Success View */
                <div className="text-center py-6 space-y-4 animate-in zoom-in-95 duration-300">
                  <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white">Thank You for Your Generosity!</h3>
                    <p className="text-xs text-slate-300 mt-1 max-w-md mx-auto">
                      Your gift of <strong className="text-emerald-400 font-bold">${successDonation.amount.toFixed(2)}</strong> has been processed via Square and credited to ministry operations.
                    </p>
                  </div>

                  {/* Official Receipt Card */}
                  <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-left max-w-md mx-auto space-y-2 text-xs">
                    <div className="flex justify-between items-center pb-2 border-b border-white/10">
                      <span className="text-slate-400">Transaction ID:</span>
                      <span className="font-mono text-amber-300 font-bold">{successDonation.transactionId}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Designation:</span>
                      <span className="text-white font-medium">{successDonation.designation}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Donor Name:</span>
                      <span className="text-white font-medium">{successDonation.donorName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Payment Processor:</span>
                      <span className="text-emerald-400 font-medium">Square Card Payment</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-white/10">
                      <span className="text-slate-400">Date:</span>
                      <span className="text-white">{new Date(successDonation.createdAt).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex justify-center gap-3 pt-2">
                    <button
                      onClick={() => {
                        window.print();
                      }}
                      className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5 text-amber-400" />
                      Print / Save Receipt
                    </button>
                    <button
                      onClick={() => setSuccessDonation(null)}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors"
                    >
                      Give Another Gift
                    </button>
                  </div>
                </div>
              ) : (
                /* Giving Form */
                <form onSubmit={handleSubmitDonation} className="space-y-4">
                  {errorMessage && (
                    <div className="p-3 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs font-semibold">
                      {errorMessage}
                    </div>
                  )}

                  {/* Frequency Toggle */}
                  <div className="flex bg-black/40 p-1 rounded-2xl border border-white/10">
                    <button
                      type="button"
                      onClick={() => setFrequency('one_time')}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                        frequency === 'one_time'
                          ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      One-Time Offering
                    </button>
                    <button
                      type="button"
                      onClick={() => setFrequency('monthly')}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                        frequency === 'monthly'
                          ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Monthly Kingdom Partner
                    </button>
                  </div>

                  {/* Gift Amount Selector */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                      Select Giving Amount
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {PRESET_AMOUNTS.map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => {
                            setSelectedAmount(amt);
                            setIsCustom(false);
                          }}
                          className={`py-3 rounded-2xl font-black text-sm transition-all border ${
                            !isCustom && selectedAmount === amt
                              ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20 scale-105'
                              : 'bg-white/5 hover:bg-white/10 text-white border-white/10'
                          }`}
                        >
                          ${amt}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setIsCustom(true)}
                        className={`py-3 rounded-2xl font-black text-xs transition-all border ${
                          isCustom
                            ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20 scale-105'
                            : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                        }`}
                      >
                        Custom
                      </button>
                    </div>

                    {isCustom && (
                      <div className="mt-2.5 relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400 font-bold text-sm">
                          $
                        </span>
                        <input
                          type="number"
                          step="1"
                          min="1"
                          value={customAmount}
                          onChange={(e) => setCustomAmount(e.target.value)}
                          placeholder="Enter your custom gift amount..."
                          className="w-full bg-black/50 border border-amber-500/50 rounded-xl pl-8 pr-4 py-2.5 text-white font-bold text-sm focus:outline-none focus:border-amber-400"
                          autoFocus
                        />
                      </div>
                    )}
                  </div>

                  {/* Designation Selector */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Fund Designation
                    </label>
                    <select
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      className="w-full bg-black/50 border border-white/15 rounded-xl px-3.5 py-2.5 text-white text-xs font-medium focus:outline-none focus:border-amber-500"
                    >
                      {DESIGNATIONS.map((d) => (
                        <option key={d} value={d} className="bg-slate-900 text-white">
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Payment Method Switcher */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                      Payment Method
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('square_card')}
                        className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all ${
                          paymentMethod === 'square_card'
                            ? 'bg-amber-500/15 border-amber-500 text-white shadow-md'
                            : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                          <CreditCard className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold">Square Card Pay</div>
                          <div className="text-[10px] text-slate-400">Credit / Debit Card</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('cash_app')}
                        className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all ${
                          paymentMethod === 'cash_app'
                            ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-md'
                            : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
                          $
                        </div>
                        <div>
                          <div className="text-xs font-bold">Cash App Direct</div>
                          <div className="text-[10px] text-slate-400">{config.cashAppCashtag || '$AuraSanctuary'}</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Payment Details Form */}
                  {paymentMethod === 'square_card' ? (
                    <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="flex items-center gap-1 font-semibold text-white">
                          <Lock className="w-3.5 h-3.5 text-amber-400" />
                          Square End-to-End Encryption
                        </span>
                        <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-slate-300">
                          Visa • MC • Amex • Discover
                        </span>
                      </div>

                      {/* Cardholder Name */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Name on Card
                        </label>
                        <input
                          type="text"
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value)}
                          placeholder="e.g. Johnathan Doe"
                          required
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      {/* Card Number */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Card Number
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={cardNumber}
                            onChange={handleCardNumberChange}
                            placeholder="4000 1234 5678 9010"
                            maxLength={19}
                            required
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-3 pr-10 py-2 text-white text-xs font-mono placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                          />
                          <CreditCard className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>

                      {/* Exp, CVV, Zip */}
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                            Expires
                          </label>
                          <input
                            type="text"
                            value={cardExp}
                            onChange={handleExpChange}
                            placeholder="MM/YY"
                            maxLength={5}
                            required
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-mono text-center placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                            CVV
                          </label>
                          <input
                            type="password"
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                            placeholder="123"
                            maxLength={4}
                            required
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-mono text-center placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                            Billing Zip
                          </label>
                          <input
                            type="text"
                            value={cardZip}
                            onChange={(e) => setCardZip(e.target.value.slice(0, 10))}
                            placeholder="75001"
                            required
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-mono text-center placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Cash App View */
                    <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-400">
                          Direct Cash App Giving
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Cashtag: <strong className="text-white">{config.cashAppCashtag || '$AuraSanctuary'}</strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleCopyCashtag}
                          className="flex-1 py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors border border-white/10"
                        >
                          {copiedCashtag ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedCashtag ? 'Cashtag Copied!' : `Copy ${config.cashAppCashtag || '$AuraSanctuary'}`}</span>
                        </button>

                        <a
                          href={`https://cash.app/${(config.cashAppCashtag || '$AuraSanctuary').replace('$', '')}/${currentAmount > 0 ? currentAmount : ''}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-500/20"
                        >
                          <span>Open Cash App</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>

                      <p className="text-[11px] text-slate-400">
                        Prefer to run your card in-app? Switch above to <strong>Square Card Pay</strong> — it charges your card directly through Square with zero app redirects!
                      </p>
                    </div>
                  )}

                  {/* Donor Info & Note */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Donor Name (or Leave Anonymous)
                      </label>
                      <input
                        type="text"
                        value={donorName}
                        onChange={(e) => setDonorName(e.target.value)}
                        placeholder="e.g. Anonymous Brother/Sister"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Email for Kingdom Receipt
                      </label>
                      <input
                        type="email"
                        value={donorEmail}
                        onChange={(e) => setDonorEmail(e.target.value)}
                        placeholder="e.g. donor@example.com"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Prayer Request or Kingdom Note (Optional)
                    </label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Share a word of encouragement, thanksgiving, or personal prayer need..."
                      rows={2}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-400 resize-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting || currentAmount <= 0}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                  >
                    {isSubmitting ? (
                      <span>Authorizing Gift with Square...</span>
                    ) : (
                      <>
                        <Heart className="w-4 h-4 fill-slate-950" />
                        <span>Give ${currentAmount > 0 ? currentAmount.toFixed(2) : '0.00'} {frequency === 'monthly' ? '/ Month' : 'Today'}</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 pt-1">
                    <Shield className="w-3.5 h-3.5 text-amber-400" />
                    <span>Safe & Secure 256-Bit SSL • Card processed by Square API</span>
                  </div>
                </form>
              )}
            </>
          )}

          {/* TAB 2: RECENT GIFTS & RECEIPTS */}
          {activeTab === 'receipts' && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Ministry Support History
              </h3>

              {recentDonations.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs bg-white/[0.02] border border-white/5 rounded-2xl">
                  No recorded donations yet on this device. When you give, your official receipts with Square transaction IDs will appear here.
                </div>
              ) : (
                recentDonations.map((d) => (
                  <div
                    key={d.id}
                    className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-white text-sm">${d.amount.toFixed(2)}</span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {d.frequency === 'monthly' ? 'Monthly' : 'One-Time'}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Completed
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{d.designation}</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                        Tx: {d.transactionId} • {new Date(d.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setSuccessDonation(d);
                        setActiveTab('give');
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-[11px] transition-colors"
                    >
                      View Receipt
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: ADMIN SQUARE & CASH APP CONFIG (Tex Only) */}
          {activeTab === 'admin' && isTexAdmin && (
            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1 text-xs text-amber-200">
                <div className="font-bold flex items-center gap-1.5 text-white">
                  <Info className="w-4 h-4 text-amber-400" />
                  Connect Your Square & Cash App Banking
                </div>
                <p className="text-[11px] text-amber-200/80 leading-relaxed">
                  Square is the free merchant platform. When you create your free Square account and enter your bank account/routing number (or your Cash App routing and account number), every card charged here automatically deposits directly into your Cash App balance!
                </p>
              </div>

              {configSaveSuccess && (
                <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold text-center">
                  Giving & Square settings saved successfully!
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Ministry Organization Name
                </label>
                <input
                  type="text"
                  value={config.ministryName}
                  onChange={(e) => setConfig({ ...config, ministryName: e.target.value })}
                  className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Cash App Cashtag (e.g. $AuraSanctuary)
                </label>
                <input
                  type="text"
                  value={config.cashAppCashtag || ''}
                  onChange={(e) => setConfig({ ...config, cashAppCashtag: e.target.value })}
                  placeholder="$AuraSanctuary"
                  className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Square Application ID
                </label>
                <input
                  type="text"
                  value={config.squareAppId || ''}
                  onChange={(e) => setConfig({ ...config, squareAppId: e.target.value })}
                  placeholder="sq0idp-... or sandbox-sq0idb-..."
                  className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Square Location ID
                </label>
                <input
                  type="text"
                  value={config.squareLocationId || ''}
                  onChange={(e) => setConfig({ ...config, squareLocationId: e.target.value })}
                  placeholder="LXXXXXXXXXX"
                  className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Tax-Exempt / Blessing Notice on Receipts
                </label>
                <textarea
                  value={config.taxExemptNotice}
                  onChange={(e) => setConfig({ ...config, taxExemptNotice: e.target.value })}
                  rows={2}
                  className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-400 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors"
              >
                Save Giving Configuration
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
