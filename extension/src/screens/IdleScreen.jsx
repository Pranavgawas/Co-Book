import React, { useState } from 'react';

// Shown when user is on a supported site but scraper couldn't get price
function ManualPriceEntry({ onConfirm, onCancel }) {
  const [price, setPrice] = useState('');
  return (
    <div className="flex flex-col gap-3">
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
        <p className="text-amber-400 text-xs font-semibold mb-1">⚡ Couldn't auto-detect price</p>
        <p className="text-amber-400/70 text-[10px]">
          Enter the total cost manually. You can update it in the session.
        </p>
      </div>
      <div>
        <label className="block text-xs text-neutral-400 mb-1.5">Total booking cost (₹)</label>
        <input
          autoFocus
          type="number"
          placeholder="e.g. 28000"
          value={price}
          onChange={e => setPrice(e.target.value)}
          className="w-full bg-neutral-800 border border-neutral-700 focus:border-emerald-500 text-white text-sm rounded-lg px-3 py-2.5 outline-none transition-colors placeholder:text-neutral-600"
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onConfirm(Number(price))}
          disabled={!price || Number(price) <= 0}
          className="flex-1 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black font-bold py-2.5 rounded-xl text-sm transition-colors"
        >
          Start Session
        </button>
        <button
          onClick={onCancel}
          className="px-4 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-400 rounded-xl text-sm transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// How it works — shown to new users
function HowItWorks() {
  const steps = [
    { icon: '🔍', title: 'Browse together', desc: 'Open any Airbnb or MakeMyTrip listing' },
    { icon: '👥', title: 'Invite friends', desc: 'Share your session ID via WhatsApp' },
    { icon: '✅', title: 'Everyone pays', desc: 'Each person confirms their share before you book' },
  ];
  return (
    <div className="flex flex-col gap-2">
      {steps.map((s, i) => (
        <div key={i} className="flex items-center gap-3 bg-neutral-800/40 rounded-lg px-3 py-2.5 border border-neutral-800">
          <span className="text-base flex-shrink-0">{s.icon}</span>
          <div>
            <p className="text-white text-xs font-semibold">{s.title}</p>
            <p className="text-neutral-500 text-[10px]">{s.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function IdleScreen({ profile, onCreateSession, onJoinSession, isCreatingSession, hasRules }) {
  const [joinId, setJoinId]       = useState('');
  const [showJoin, setShowJoin]   = useState(false);
  const [showHowTo, setShowHowTo] = useState(false);
  const [showManual, setShowManual] = useState(false);

  const isOnSupportedSite = typeof window !== 'undefined' &&
    (window.location.href.includes('airbnb') || window.location.href.includes('makemytrip'));

  const handleCreateClick = async () => {
    if (!isOnSupportedSite) {
      // Not on a supported site — open Airbnb
      window.open('https://www.airbnb.co.in', '_blank');
      return;
    }
    // Try auto-detect first; if rules missing, show manual entry
    if (!hasRules) {
      setShowManual(true);
      return;
    }
    await onCreateSession();
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (joinId.trim()) onJoinSession(joinId.trim());
  };

  if (showManual) {
    return (
      <ManualPriceEntry
        onConfirm={(price) => { setShowManual(false); onCreateSession(price); }}
        onCancel={() => setShowManual(false)}
      />
    );
  }

  if (showHowTo) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="text-white font-semibold text-sm">How SplitSync works</p>
          <button onClick={() => setShowHowTo(false)} className="text-neutral-500 hover:text-white text-xs">← Back</button>
        </div>
        <HowItWorks />
        <button
          onClick={() => { setShowHowTo(false); handleCreateClick(); }}
          className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-2.5 rounded-xl text-sm transition-colors"
        >
          {isOnSupportedSite ? "Start My First Session" : "Open Airbnb →"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Profile card */}
      {profile ? (
        <div className="flex items-center gap-3 bg-neutral-800/50 rounded-xl p-3 border border-neutral-800">
          <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center text-black font-bold text-sm flex-shrink-0">
            {profile.name?.charAt(0)?.toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white font-semibold text-sm truncate">{profile.name}</p>
            <p className="text-neutral-500 text-[10px] truncate">{profile.upi_id || 'No UPI set'}</p>
          </div>
          <div className="flex items-center gap-1.5">
            {isOnSupportedSite ? (
              <span className="text-[9px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Ready
              </span>
            ) : (
              <span className="text-[9px] text-neutral-500 bg-neutral-800 border border-neutral-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Visit Airbnb
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
          <p className="text-amber-400 text-xs font-semibold">⚠ Profile incomplete</p>
          <p className="text-amber-400/70 text-[10px] mt-0.5">Add your name and UPI ID to use SplitSync</p>
        </div>
      )}

      {/* What page am I on indicator */}
      {!isOnSupportedSite && (
        <div className="bg-neutral-800/50 rounded-lg p-2.5 border border-neutral-800 flex items-center gap-2">
          <span className="text-base">📍</span>
          <div>
            <p className="text-neutral-300 text-[11px] font-medium">Go to Airbnb or MakeMyTrip</p>
            <p className="text-neutral-600 text-[10px]">Browse to a listing, then start a session</p>
          </div>
        </div>
      )}

      {/* Primary CTA */}
      <button
        onClick={handleCreateClick}
        disabled={isCreatingSession || !profile}
        className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
      >
        {isCreatingSession ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Creating session...
          </>
        ) : isOnSupportedSite ? (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Start Group Session
          </>
        ) : (
          <>Open Airbnb to Start</>
        )}
      </button>

      {/* Divider */}
      <div className="relative flex items-center gap-2">
        <div className="h-px flex-1 bg-neutral-800" />
        <span className="text-neutral-600 text-[10px] uppercase tracking-widest">or</span>
        <div className="h-px flex-1 bg-neutral-800" />
      </div>

      {/* Join session */}
      {!showJoin ? (
        <button
          onClick={() => setShowJoin(true)}
          className="w-full bg-neutral-800/80 hover:bg-neutral-800 border border-neutral-700 hover:border-neutral-600 text-neutral-300 font-semibold py-2.5 rounded-xl text-sm transition-colors"
        >
          Join a Friend's Session
        </button>
      ) : (
        <form onSubmit={handleJoin} className="flex flex-col gap-2">
          <p className="text-[10px] text-neutral-500">Paste the session ID your friend shared:</p>
          <div className="flex gap-2">
            <input
              autoFocus
              type="text"
              placeholder="Paste session ID here..."
              value={joinId}
              onChange={e => setJoinId(e.target.value)}
              className="flex-1 bg-neutral-800 border border-neutral-700 focus:border-emerald-500 text-white text-sm rounded-lg px-3 py-2 outline-none transition-colors placeholder:text-neutral-600 font-mono text-[11px]"
            />
            <button
              type="submit"
              disabled={!joinId.trim()}
              className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black font-bold px-3 py-2 rounded-lg text-sm transition-colors"
            >
              Join
            </button>
          </div>
          <button
            type="button"
            onClick={() => { setShowJoin(false); setJoinId(''); }}
            className="text-[10px] text-neutral-600 hover:text-neutral-400"
          >
            Cancel
          </button>
        </form>
      )}

      {/* How it works link */}
      <button
        onClick={() => setShowHowTo(true)}
        className="text-[10px] text-neutral-600 hover:text-emerald-400 transition-colors"
      >
        How does SplitSync work? →
      </button>
    </div>
  );
}
