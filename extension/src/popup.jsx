import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { supabase } from './supabaseClient';
import { ensureAuthenticated, getProfile, saveProfile, persistSessionToStorage } from './utils/auth';

// ─── Demo session shown to new users ─────────────────────────────────────────
const DEMO_SESSION = {
  id: 'demo',
  property_title: 'Beachfront Villa, Goa (4 Nights)',
  total_cost: 32000,
  status: 'locked_for_payment',
  created_at: new Date().toISOString(),
};
const DEMO_MEMBERS = [
  { name: 'You', status: 'paid',    amount: 10667, color: '#10b981' },
  { name: 'Rahul S', status: 'paid',    amount: 10667, color: '#3b82f6' },
  { name: 'Priya K', status: 'pending', amount: 10666, color: '#f59e0b' },
];

function DemoMode() {
  const paidCount = DEMO_MEMBERS.filter(m => m.status === 'paid').length;
  return (
    <div className="flex flex-col gap-3">
      <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Demo</span>
          <p className="text-white font-semibold text-xs">See how it works</p>
        </div>
        <p className="text-neutral-400 text-[11px] line-clamp-1 mb-2">{DEMO_SESSION.property_title}</p>
        <div className="flex justify-between items-center">
          <span className="text-neutral-500 text-[10px]">Total</span>
          <span className="text-white font-bold text-sm">₹{DEMO_SESSION.total_cost.toLocaleString('en-IN')}</span>
        </div>
        <div className="flex justify-between items-center mt-0.5">
          <span className="text-neutral-500 text-[10px]">Per person (3)</span>
          <span className="text-emerald-400 font-bold text-sm">₹{(10667).toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* Payment status */}
      <div className="space-y-1.5">
        {DEMO_MEMBERS.map((m, i) => (
          <div
            key={i}
            className={`flex items-center gap-2 rounded-lg p-2 border transition-all ${
              m.status === 'paid'
                ? 'bg-emerald-500/5 border-emerald-500/20'
                : 'bg-amber-500/5 border-amber-500/20 border-l-2 border-l-amber-500'
            }`}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white"
              style={{ background: m.color + '33', borderColor: m.color + '55', border: '1px solid' }}
            >
              {m.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium">{m.name}</p>
              <p className="text-neutral-500 text-[10px]">₹{m.amount.toLocaleString('en-IN')}</p>
            </div>
            {m.status === 'paid' ? (
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/20">✓ Paid</span>
            ) : (
              <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded animate-pulse border border-amber-500/20">Pending</span>
            )}
          </div>
        ))}
      </div>

      <div className="bg-neutral-800/50 rounded-xl p-2.5 border border-neutral-800 text-center">
        <p className="text-neutral-400 text-[11px]">
          {paidCount}/{DEMO_MEMBERS.length} paid · Booking unlocks when everyone pays
        </p>
      </div>
    </div>
  );
}

// ─── Profile edit form ────────────────────────────────────────────────────────
function ProfileForm({ profile, user, onSaved, onCancel }) {
  const [name, setName]     = useState(profile?.name || '');
  const [upiId, setUpiId]   = useState(profile?.upi_id || '');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg]       = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !upiId.trim()) return;
    setSaving(true);
    setMsg('');
    const { error } = await saveProfile(user.id, { name: name.trim(), upiId: upiId.trim() });
    if (error) {
      setMsg('❌ Save failed. Try again.');
    } else {
      await persistSessionToStorage();
      const p = await getProfile(user.id);
      setMsg('✓ Saved!');
      setTimeout(() => onSaved(p), 900);
    }
    setSaving(false);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 mb-1">
        {profile && onCancel && (
          <button onClick={onCancel} className="text-neutral-500 hover:text-white">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          </button>
        )}
        <h3 className="text-white font-bold text-sm">{profile ? 'Edit Profile' : 'Set Up Profile'}</h3>
      </div>

      {!profile && (
        <p className="text-neutral-400 text-xs bg-neutral-800/50 rounded-lg p-2.5 border border-neutral-800">
          SplitSync uses your name and UPI ID to generate payment requests. Needed once, then it remembers you.
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <label className="block text-xs text-neutral-400 mb-1">Your name</label>
          <input
            type="text"
            placeholder="e.g. Rahul Sharma"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full bg-neutral-800 border border-neutral-700 focus:border-emerald-500 text-white text-sm rounded-lg px-3 py-2.5 outline-none transition-colors placeholder:text-neutral-600"
          />
        </div>
        <div>
          <label className="block text-xs text-neutral-400 mb-1">UPI ID / Payment handle</label>
          <input
            type="text"
            placeholder="e.g. rahul@kotak  or  $rahulv (Venmo)"
            value={upiId}
            onChange={e => setUpiId(e.target.value)}
            className="w-full bg-neutral-800 border border-neutral-700 focus:border-emerald-500 text-white text-sm rounded-lg px-3 py-2.5 outline-none transition-colors placeholder:text-neutral-600"
          />
          <p className="text-[10px] text-neutral-600 mt-1">Friends will send their share to this address</p>
        </div>

        {msg && (
          <p className={`text-xs px-2.5 py-2 rounded-lg ${
            msg.startsWith('❌')
              ? 'text-red-400 bg-red-500/10 border border-red-500/20'
              : 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
          }`}>{msg}</p>
        )}

        <button
          type="submit"
          disabled={saving || !name.trim() || !upiId.trim()}
          className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black font-bold py-2.5 rounded-xl text-sm transition-colors"
        >
          {saving ? 'Saving...' : profile ? 'Save Changes' : 'Continue →'}
        </button>
      </form>
    </div>
  );
}

// ─── Trip history ─────────────────────────────────────────────────────────────
function TripHistory({ sessions, userId, onDelete, onOpenTrip }) {
  if (sessions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-neutral-600 text-xs">No trips yet.</p>
        <p className="text-neutral-700 text-[10px] mt-1">Start a session on Airbnb to see it here.</p>
      </div>
    );
  }

  const statusConfig = {
    browsing:            { label: 'Browsing',  color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    locked_for_payment:  { label: 'Paying',    color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20' },
    completed:           { label: 'Done',      color: 'text-neutral-500', bg: 'bg-neutral-800 border-neutral-700' },
  };

  return (
    <div className="space-y-2">
      {sessions.map(s => {
        const cfg = statusConfig[s.status] || statusConfig.completed;
        return (
          <div
            key={s.id}
            onClick={() => onOpenTrip(s)}
            className="bg-neutral-800/50 hover:bg-neutral-800/80 border border-neutral-700/50 hover:border-neutral-600 rounded-xl p-3 cursor-pointer transition-all"
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <p className="text-white text-xs font-semibold truncate flex-1 leading-tight">
                {s.property_title || 'Booking'}
              </p>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className={`text-[9px] px-1.5 py-0.5 rounded border uppercase tracking-wider font-bold ${cfg.color} ${cfg.bg}`}>
                  {cfg.label}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(s); }}
                  className="text-neutral-600 hover:text-red-400 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-neutral-500 text-[10px]">
                {new Date(s.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
              <p className="text-white text-xs font-bold">₹{Number(s.total_cost).toLocaleString('en-IN')}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Popup ───────────────────────────────────────────────────────────────
const Popup = () => {
  const [view, setView]             = useState('loading');
  const [profile, setProfile]       = useState(null);
  const [activeSession, setSession] = useState(null);
  const [sessions, setSessions]     = useState([]);
  const [user, setUser]             = useState(null);

  useEffect(() => {
    (async () => {
      const u = await ensureAuthenticated().catch(() => null);
      if (!u) { setView('setup'); return; }
      setUser(u);
      await persistSessionToStorage();

      const p = await getProfile(u.id).catch(() => null);
      setProfile(p);

      if (p) {
        const { data: memberRows } = await supabase
          .from('session_members')
          .select('session_id')
          .eq('user_id', u.id);

        if (memberRows?.length) {
          const ids = memberRows.map(r => r.session_id);
          const { data: allSessions } = await supabase
            .from('sessions')
            .select('id, property_title, total_cost, status, property_url, created_at, host_id')
            .in('id', ids)
            .order('created_at', { ascending: false });

          if (allSessions) {
            setSessions(allSessions);
            const active = allSessions.find(s => s.status !== 'completed');
            if (active) setSession(active);
          }
        }
      }

      setView(p?.name ? 'home' : 'setup');
    })();
  }, []);

  const handleDeleteTrip = async (s) => {
    if (!window.confirm('Remove this trip from your history?')) return;
    if (s.host_id === user?.id) {
      await supabase.from('sessions').delete().eq('id', s.id);
    } else {
      await supabase.from('session_members').delete()
        .eq('session_id', s.id).eq('user_id', user?.id);
    }
    setSessions(prev => prev.filter(x => x.id !== s.id));
    chrome.storage.local.get(['cobook_active_session'], (result) => {
      if (result.cobook_active_session?.id === s.id) {
        chrome.storage.local.remove('cobook_active_session');
        setSession(null);
      }
    });
  };

  const handleOpenTrip = (s) => {
    chrome.storage.local.set({ cobook_active_session: s }, () => {
      chrome.tabs.create({ url: s.property_url });
    });
  };

  // ── Loading ──
  if (view === 'loading') {
    return (
      <div className="w-72 bg-neutral-900 flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />
          <span className="text-neutral-600 text-xs">Loading SplitSync...</span>
        </div>
      </div>
    );
  }

  // ── Profile Setup ──
  if (view === 'setup') {
    return (
      <div className="w-72 bg-neutral-900 text-white font-sans">
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-neutral-800">
          <div className="w-6 h-6 rounded-md bg-emerald-500 flex items-center justify-center text-xs">✈</div>
          <span className="font-bold text-sm">Setup Profile</span>
        </div>
        <div className="p-4">
          <ProfileForm
            profile={null}
            user={user}
            onSaved={(p) => { setProfile(p); setView('home'); }}
          />
        </div>
      </div>
    );
  }

  // ── Edit Profile ──
  if (view === 'editProfile') {
    return (
      <div className="w-72 bg-neutral-900 text-white font-sans">
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-neutral-800">
          <div className="w-6 h-6 rounded-md bg-emerald-500 flex items-center justify-center text-xs">✈</div>
          <span className="font-bold text-sm">Edit Profile</span>
        </div>
        <div className="p-4">
          <ProfileForm
            profile={profile}
            user={user}
            onSaved={(p) => { setProfile(p); setView('home'); }}
            onCancel={() => setView('home')}
          />
        </div>
      </div>
    );
  }

  // ── Trip History ──
  if (view === 'trips') {
    return (
      <div className="w-72 bg-neutral-900 text-white font-sans flex flex-col" style={{ maxHeight: '520px' }}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-emerald-500 flex items-center justify-center text-xs">✈</div>
            <span className="font-bold text-sm">My Trips</span>
          </div>
          <button onClick={() => setView('home')} className="text-xs text-neutral-500 hover:text-white transition-colors">
            ← Home
          </button>
        </div>
        <div className="p-4 overflow-y-auto flex-1">
          <TripHistory
            sessions={sessions}
            userId={user?.id}
            onDelete={handleDeleteTrip}
            onOpenTrip={handleOpenTrip}
          />
        </div>
      </div>
    );
  }

  // ── Home ──
  return (
    <div className="w-72 bg-neutral-900 text-white font-sans" style={{ minHeight: '360px' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-emerald-500 flex items-center justify-center text-xs">✈</div>
          <span className="font-bold text-sm">SplitSync</span>
        </div>
        <div className="flex gap-3">
          <button className="text-xs text-emerald-400 font-bold">Home</button>
          <button onClick={() => setView('trips')} className="text-xs text-neutral-500 hover:text-white transition-colors">
            Trips
            {sessions.length > 0 && (
              <span className="ml-1 bg-neutral-700 text-neutral-400 text-[9px] px-1.5 py-0.5 rounded-full">
                {sessions.length}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-3">
        {/* Profile card */}
        {profile ? (
          <button
            onClick={() => setView('editProfile')}
            className="w-full flex items-center gap-3 bg-neutral-800/50 hover:bg-neutral-800 rounded-xl p-3 border border-neutral-700/50 hover:border-neutral-600 transition-colors text-left"
          >
            <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center text-black font-bold text-sm flex-shrink-0">
              {profile.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white text-sm font-semibold truncate">{profile.name}</p>
              <p className="text-neutral-500 text-[10px] truncate">{profile.upi_id}</p>
            </div>
            <svg className="w-3.5 h-3.5 text-neutral-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        ) : (
          <button
            onClick={() => setView('setup')}
            className="w-full bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/30 rounded-xl p-3 text-left transition-colors"
          >
            <p className="text-amber-400 text-sm font-semibold">⚠ Complete your profile</p>
            <p className="text-amber-400/70 text-xs mt-0.5">Add your name and UPI ID to get started →</p>
          </button>
        )}

        {/* Active session */}
        {activeSession && (
          <div
            onClick={() => handleOpenTrip(activeSession)}
            className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 cursor-pointer hover:border-emerald-500/40 transition-colors"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Active Session
              </span>
              <span className="text-[10px] text-neutral-500">Click to open →</span>
            </div>
            <p className="text-white text-xs font-semibold truncate">{activeSession.property_title}</p>
            <p className="text-neutral-500 text-[10px] mt-0.5">
              ₹{Number(activeSession.total_cost).toLocaleString('en-IN')} · {activeSession.status?.replace(/_/g, ' ')}
            </p>
          </div>
        )}

        {/* Demo section — only shown if no active session */}
        {!activeSession && (
          <div>
            <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold mb-2">Preview</p>
            <DemoMode />
          </div>
        )}

        {/* CTA */}
        <button
          onClick={() => chrome.tabs.create({ url: 'https://www.airbnb.co.in' })}
          className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-2.5 rounded-xl text-sm transition-colors"
        >
          Open Airbnb to Start
        </button>

        <button
          onClick={() => chrome.tabs.create({ url: 'https://splitsync-iota.vercel.app/' })}
          className="w-full bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 font-medium py-2 rounded-xl text-sm transition-colors"
        >
          Visit SplitSync Website
        </button>
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById('popup-root'));
root.render(<Popup />);
