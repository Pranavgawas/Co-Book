import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { supabase } from './supabaseClient';
import { ensureAuthenticated, getProfile, saveProfile, persistSessionToStorage } from './utils/auth';

const Popup = () => {
  const [view, setView]             = useState('loading'); // loading | home | editProfile
  const [profile, setProfile]       = useState(null);
  const [activeSession, setSession] = useState(null);
  const [user, setUser]             = useState(null);
  const [saving, setSaving]         = useState(false);
  const [saveMsg, setSaveMsg]       = useState('');

  // Form state for profile edit
  const [name, setName]   = useState('');
  const [upiId, setUpiId] = useState('');

  useEffect(() => {
    (async () => {
      console.log('[CoBook Popup] Loading...');
      const u = await ensureAuthenticated();
      if (!u) { setView('home'); return; }
      setUser(u);
      // Save session to chrome.storage so the content script uses the same user
      await persistSessionToStorage();

      const p = await getProfile(u.id);
      setProfile(p);

      if (p) {
        setName(p.name || '');
        setUpiId(p.upi_id || '');
      }

      // Load active session — two-step query (join filtering not supported in PostgREST)
      if (p) {
        const { data: memberRows } = await supabase
          .from('session_members')
          .select('session_id')
          .eq('user_id', u.id);

        if (memberRows?.length) {
          const ids = memberRows.map(r => r.session_id);
          const { data: activeSession } = await supabase
            .from('sessions')
            .select('id, property_title, total_cost, status')
            .in('id', ids)
            .neq('status', 'completed')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          if (activeSession) setSession(activeSession);
        }
      }

      setView(p ? 'home' : 'editProfile');
      console.log('[CoBook Popup] Ready. Profile:', p?.name ?? 'none');
    })();
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!name.trim() || !upiId.trim()) return;
    setSaving(true);
    setSaveMsg('');
    const { error } = await saveProfile(user.id, { name: name.trim(), upiId: upiId.trim() });
    if (error) {
      setSaveMsg('❌ Save failed. Check console for details.');
    } else {
      const p = await getProfile(user.id);
      setProfile(p);
      await persistSessionToStorage(); // ensure content script gets updated session
      setSaveMsg('✓ Saved!');
      setTimeout(() => { setSaveMsg(''); setView('home'); }, 1200);
    }
    setSaving(false);
  };

  const openAirbnb  = () => chrome.tabs.create({ url: 'https://www.airbnb.co.in' });
  const openWebsite = () => chrome.tabs.create({ url: 'https://cobook.app' });

  if (view === 'loading') {
    return (
      <div className="w-72 bg-neutral-900 flex items-center justify-center py-10">
        <span className="text-neutral-500 text-sm animate-pulse">Loading CoBook...</span>
      </div>
    );
  }

  if (view === 'editProfile') {
    return (
      <div className="w-72 bg-neutral-900 text-white font-sans">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-800">
          {profile && (
            <button onClick={() => setView('home')} className="text-neutral-500 hover:text-white mr-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
            </button>
          )}
          <span className="text-lg">✈️</span>
          <span className="font-bold text-sm">{profile ? 'Edit Profile' : 'Setup Profile'}</span>
        </div>
        <div className="p-4 flex flex-col gap-3">
          <p className="text-neutral-400 text-xs">
            {profile ? 'Update your name or payment handle.' : 'Set your name and UPI ID to start splitting costs with friends.'}
          </p>
          <form onSubmit={handleSaveProfile} className="flex flex-col gap-3">
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Display Name</label>
              <input
                type="text"
                placeholder="e.g. Rahul Sharma"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 focus:border-emerald-500 text-white text-sm rounded-lg px-3 py-2 outline-none transition-colors placeholder:text-neutral-600"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1">UPI ID / Payment Handle</label>
              <input
                type="text"
                placeholder="e.g. rahul@kotak  or  $rahulv (Venmo)"
                value={upiId}
                onChange={e => setUpiId(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 focus:border-emerald-500 text-white text-sm rounded-lg px-3 py-2 outline-none transition-colors placeholder:text-neutral-600"
              />
              <p className="text-[10px] text-neutral-600 mt-1">Friends will pay you at this address.</p>
            </div>
            {saveMsg && (
              <p className={`text-xs px-2 py-1.5 rounded ${saveMsg.startsWith('❌') ? 'text-red-400 bg-red-500/10 border border-red-500/20' : 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'}`}>
                {saveMsg}
              </p>
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
      </div>
    );
  }

  // Home view
  return (
    <div className="w-72 bg-neutral-900 text-white font-sans">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-neutral-800">
        <span className="text-lg">✈️</span>
        <span className="font-bold text-sm">CoBook</span>
        <span className="ml-auto text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">Active</span>
      </div>

      <div className="p-4 flex flex-col gap-3">
        {/* Profile Card */}
        {profile ? (
          <div
            className="flex items-center gap-3 bg-neutral-800/50 rounded-xl p-3 border border-neutral-700/40 cursor-pointer hover:border-neutral-600 transition-colors"
            onClick={() => setView('editProfile')}
            title="Click to edit profile"
          >
            <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center text-black font-bold text-sm flex-shrink-0">
              {profile.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white text-sm font-semibold truncate">{profile.name}</p>
              <p className="text-neutral-400 text-[10px] truncate">{profile.upi_id}</p>
            </div>
            <svg className="w-3.5 h-3.5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
        ) : (
          <div
            className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 cursor-pointer hover:border-amber-500/60 transition-colors"
            onClick={() => setView('editProfile')}
          >
            <p className="text-amber-400 text-sm font-semibold">⚠️ Profile not set up yet</p>
            <p className="text-amber-400/70 text-xs mt-0.5">Click here to add your name and UPI ID →</p>
          </div>
        )}

        {/* Active Session */}
        {activeSession && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
            <p className="text-[10px] text-emerald-400 uppercase tracking-widest mb-1">Active Session</p>
            <p className="text-white text-xs font-semibold truncate">{activeSession.property_title || 'Airbnb Booking'}</p>
            <p className="text-neutral-400 text-[10px] mt-0.5">
              ₹{Number(activeSession.total_cost).toLocaleString()} · <span className="capitalize">{activeSession.status?.replace(/_/g, ' ')}</span>
            </p>
          </div>
        )}

        {/* Actions */}
        <button onClick={openAirbnb} className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-2.5 rounded-xl text-sm transition-colors">
          Open Airbnb
        </button>
        <button onClick={openWebsite} className="w-full bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white font-semibold py-2 rounded-xl text-sm transition-colors">
          Visit CoBook Website
        </button>
        <p className="text-center text-[10px] text-neutral-600">Navigate to Airbnb to start a group session.</p>
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById('popup-root'));
root.render(<Popup />);
