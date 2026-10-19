import React, { useState, useEffect } from 'react';
import { 
  MapPin, Search, Phone, ExternalLink, Calendar, 
  Clock, Heart, Shield, Navigation, Users, Check,
  Sparkles, Award, Compass, Share2
} from 'lucide-react';
import { soundEffects } from '../../services/audio';

export interface RuMeetingItem {
  id: string;
  name: string;
  churchName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  lat: number;
  lng: number;
  dayOfWeek: string;
  meetingTime: string;
  leaderName?: string;
  contactPhone?: string;
  contactEmail?: string;
  website?: string;
  hasChildcare?: boolean;
  hasDinner?: boolean;
  notes?: string;
  isFeatured?: boolean;
  distanceMiles?: number;
}

export const RuMeetingLocator: React.FC = () => {
  const [zipQuery, setZipQuery] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [radius, setRadius] = useState<number>(100);
  const [meetings, setMeetings] = useState<RuMeetingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchMeetings = async (queryZip = zipQuery, state = selectedState) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (queryZip.trim()) params.append('zip', queryZip.trim());
      if (state.trim()) params.append('state', state.trim());
      params.append('radius', radius.toString());

      const res = await fetch(`/api/recovery/ru-meetings?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.meetings) {
          setMeetings(data.meetings);
        }
      }
    } catch (e) {
      console.warn('Failed to load RU meetings:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    soundEffects.playTap();
    fetchMeetings(zipQuery, selectedState);
  };

  const handleShareMeeting = (m: RuMeetingItem) => {
    soundEffects.playTap();
    const shareText = `Join us at ${m.name}!\nLocation: ${m.churchName}, ${m.address}, ${m.city}, ${m.state} ${m.zip}\nMeeting: Every ${m.dayOfWeek} at ${m.meetingTime}\n${m.contactPhone ? `Phone: ${m.contactPhone}\n` : ''}${m.notes ? `Info: ${m.notes}` : ''}`;
    
    if (navigator.share) {
      navigator.share({
        title: m.name,
        text: shareText
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareText);
      setCopiedId(m.id);
      setTimeout(() => setCopiedId(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-amber-950/60 via-slate-900 to-indigo-950/40 border border-amber-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black uppercase tracking-wider border border-amber-500/30">
              <Compass className="w-3.5 h-3.5" />
              <span>National RU Chapter Directory</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Find an RU Meeting Near You
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Reformers Unanimous is a faith-based Christ-centered addiction and stronghold recovery ministry that meets weekly in local Bible-believing churches nationwide.
            </p>
          </div>

          {/* Quick Filter: Winchester VA (Route 50) */}
          <button
            onClick={() => {
              soundEffects.playTap();
              setZipQuery('22603');
              setSelectedState('VA');
              fetchMeetings('22603', 'VA');
            }}
            className="px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white font-bold text-xs shadow-lg shadow-amber-600/30 transition-all flex items-center gap-2 self-start md:self-auto shrink-0"
          >
            <MapPin className="w-4 h-4 fill-white" />
            <span>Winchester, VA (Route 50 Chapter)</span>
          </button>
        </div>

        {/* Search Bar & Filters */}
        <form onSubmit={handleSearchSubmit} className="mt-6 pt-6 border-t border-white/10 grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="relative sm:col-span-5">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={zipQuery}
              onChange={(e) => setZipQuery(e.target.value)}
              placeholder="Enter Zip Code or City (e.g. 22603, Winchester)..."
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/5 border border-white/15 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="sm:col-span-4">
            <select
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                fetchMeetings(zipQuery, e.target.value);
              }}
              className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-white/15 text-sm text-white focus:outline-none focus:border-amber-500"
            >
              <option value="">All States / Regions</option>
              <option value="VA">Virginia (VA)</option>
              <option value="WV">West Virginia (WV)</option>
              <option value="MD">Maryland (MD)</option>
              <option value="NC">North Carolina (NC)</option>
              <option value="IL">Illinois (IL - RU HQ)</option>
              <option value="TX">Texas (TX)</option>
              <option value="GA">Georgia (GA)</option>
              <option value="OH">Ohio (OH)</option>
              <option value="IN">Indiana (IN)</option>
              <option value="FL">Florida (FL)</option>
              <option value="CA">California (CA)</option>
            </select>
          </div>

          <div className="sm:col-span-3 flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm transition-all shadow-md flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Locate</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                soundEffects.playTap();
                setZipQuery('');
                setSelectedState('');
                fetchMeetings('', '');
              }}
              className="px-3.5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors text-xs font-bold"
              title="Reset search"
            >
              Clear
            </button>
          </div>
        </form>
      </div>

      {/* Featured Chapters Banner if Winchester */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-300">
              Verified RU Chapters ({meetings.length} found)
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Meeting Day: Every Friday Night (Standard RU Format)
          </span>
        </div>

        {meetings.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-white/10 text-slate-400 space-y-3">
            <Compass className="w-10 h-10 text-slate-500 mx-auto opacity-50" />
            <p className="font-bold text-white">No RU chapters matched your search criteria.</p>
            <p className="text-xs max-w-md mx-auto">
              Try searching a nearby zip code or clear filters to view all active regional chapters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {meetings.map((m) => {
              const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${m.churchName} ${m.address} ${m.city} ${m.state} ${m.zip}`)}`;
              const isEbc = m.id === 'ru_winchester_ebc';

              return (
                <div
                  key={m.id}
                  className={`p-6 rounded-3xl border transition-all duration-300 flex flex-col justify-between relative overflow-hidden ${
                    isEbc
                      ? 'bg-gradient-to-br from-amber-950/50 via-slate-900 to-amber-950/30 border-amber-500 shadow-xl shadow-amber-950/30 ring-1 ring-amber-500/50'
                      : m.isFeatured
                      ? 'bg-gradient-to-br from-slate-900 to-indigo-950/40 border-amber-500/40 shadow-lg'
                      : 'bg-slate-900/60 hover:bg-slate-900 border-white/10'
                  }`}
                >
                  {isEbc && (
                    <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-yellow-600 text-slate-950 font-black text-[10px] uppercase tracking-wider px-3 py-1 rounded-bl-xl shadow-md">
                      Featured • Route 50 Chapter
                    </div>
                  )}

                  <div className="space-y-4">
                    {/* Chapter Name & Distance */}
                    <div className="flex items-start justify-between gap-3 pr-8">
                      <div>
                        <h4 className="font-black text-white text-base sm:text-lg leading-snug">
                          {m.churchName}
                        </h4>
                        <p className="text-amber-400 text-xs font-bold mt-0.5">
                          {m.name}
                        </p>
                      </div>
                      {m.distanceMiles !== undefined && (
                        <span className="shrink-0 text-xs font-bold px-2.5 py-1 rounded-full bg-white/10 text-slate-200">
                          {m.distanceMiles} mi
                        </span>
                      )}
                    </div>

                    {/* Address & Meeting Time */}
                    <div className="space-y-2 text-xs text-slate-300">
                      <div className="flex items-start gap-2.5">
                        <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-white">{m.address}</p>
                          <p className="text-slate-400">{m.city}, {m.state} {m.zip}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Every <strong className="text-white">{m.dayOfWeek}</strong></span>
                        <Clock className="w-3.5 h-3.5 text-amber-400 ml-2 shrink-0" />
                        <span className="text-white font-bold">{m.meetingTime}</span>
                      </div>
                    </div>

                    {/* Amenities / Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {m.hasDinner && (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-[10px] font-bold border border-emerald-500/20">
                          🍲 Fellowship Dinner (6:15 PM)
                        </span>
                      )}
                      {m.hasChildcare && (
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-300 text-[10px] font-bold border border-blue-500/20">
                          👶 Nursery / Childcare
                        </span>
                      )}
                      <span className="px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 text-[10px] font-bold border border-purple-500/20">
                        ✝️ Christ-Centered
                      </span>
                    </div>

                    {/* Notes */}
                    {m.notes && (
                      <p className="text-xs text-slate-400 leading-relaxed bg-black/20 p-3 rounded-2xl border border-white/5">
                        {m.notes}
                      </p>
                    )}
                  </div>

                  {/* Action Suite */}
                  <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        <span>Directions</span>
                      </a>

                      {m.contactPhone && (
                        <a
                          href={`tel:${m.contactPhone.replace(/\D/g, '')}`}
                          className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Call</span>
                        </a>
                      )}

                      {m.website && (
                        <a
                          href={m.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-colors"
                          title="Visit Church Website"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>

                    <button
                      onClick={() => handleShareMeeting(m)}
                      className="px-2.5 py-2 rounded-xl bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white transition-colors text-xs font-bold flex items-center gap-1"
                      title="Share Meeting Info"
                    >
                      {copiedId === m.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="w-3.5 h-3.5" />
                          <span>Share</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
