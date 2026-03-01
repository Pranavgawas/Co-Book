import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { ensureAuthenticated, saveProfile, getProfile } from './utils/auth';
import { extractPropertyData, getDomainForCurrentPage } from './utils/scraper';
import { usePaymentSync } from './hooks/usePaymentSync';
import { useSessionSync } from './hooks/useSessionSync';

import LoadingScreen from './screens/LoadingScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import IdleScreen from './screens/IdleScreen';
import LobbyScreen from './screens/LobbyScreen';
import PaymentScreen from './screens/PaymentScreen';
import SuccessScreen from './screens/SuccessScreen';
import SettingsScreen from './screens/SettingsScreen';

const STORAGE_KEY = 'cobook_active_session'; // Keeping storage key for compatibility

export default function Hero() {
  const [screen, setScreen]       = useState('loading');
  const [user, setUser]           = useState(null);
  const [profile, setProfile]     = useState(null);
  const [session, setSession]     = useState(null);
  const [shortlisted, setShortlisted] = useState([]);
  const [minimized, setMinimized] = useState(false);
  const [error, setError]         = useState('');
  
  // Remote Adapter Rules State
  const [adapterRules, setAdapterRules] = useState(null);

  const members = usePaymentSync(session?.id);
  const liveSession = useSessionSync(session?.id);

  // --- BOOT: Auth + Remote Adapter Fetch ---
  useEffect(() => {
    (async () => {
      console.log('[SplitSync] ?? Booting...');
      
      // 1. Fetch Remote Scraper Rules
      const currentDomain = getDomainForCurrentPage();
      if (currentDomain) {
        const { data, error: rErr } = await supabase
          .from('platform_adapters')
          .select('selectors')
          .eq('domain', currentDomain)
          .maybeSingle();
        
        if (data) {
          setAdapterRules(data.selectors);
          console.log(`[SplitSync] Loaded remote scraper rules for ${currentDomain}`);
        } else {
          console.warn(`[SplitSync] No remote rules found for ${currentDomain}. Check platform_adapters table.`);
        }
      }

      // 2. Auth
      const u = await ensureAuthenticated();
      if (!u) { setScreen('idle'); return; }
      setUser(u);
      
      const p = await getProfile(u.id);
      if (!p || !p.name) { setScreen('onboarding'); return; }
      setProfile(p);

      // 3. Restore Session
      try {
        const stored = await chrome.storage.local.get(STORAGE_KEY);
        const savedSession = stored[STORAGE_KEY];
        if (savedSession?.id) {
          const { data } = await supabase.from('sessions').select('*').eq('id', savedSession.id).neq('status', 'completed').maybeSingle();
          if (data) {
            setSession(data);
            setScreen(data.status === 'locked_for_payment' ? 'payment' : 'lobby');
            return;
          }
        }
      } catch (_) {}
      setScreen('idle');
    })();
  }, []);

  // Sync shortlisted properties
  useEffect(() => {
    if (!session?.id) { setShortlisted([]); return; }
    const fetchShortlisted = async () => {
      const { data } = await supabase.from('shortlisted_properties').select('*').eq('session_id', session.id).order('created_at', { ascending: true });
      if (data) setShortlisted(data);
    };
    fetchShortlisted();
    const channel = supabase.channel(`shortlist_${session.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shortlisted_properties', filter: `session_id=eq.${session.id}` }, () => fetchShortlisted())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [session?.id]);

  useEffect(() => {
    if (!liveSession) return;
    setSession(liveSession);
    if (liveSession.status === 'locked_for_payment' && screen === 'lobby') { setScreen('payment'); setMinimized(false); }
    if (liveSession.status === 'completed' && screen === 'payment') { setScreen('success'); }
  }, [liveSession]);

  useEffect(() => {
    if (screen === 'payment' && members.length > 0 && members.every(m => m.payment_status === 'paid')) { setScreen('success'); }
  }, [members, screen]);

  useEffect(() => {
    const handler = () => {
      setMinimized(false);
      if (session) setScreen('payment');
      else {
        setError('?? Create a SplitSync session first to secure your group booking!');
        setScreen(profile ? 'idle' : 'onboarding');
      }
    };
    window.addEventListener('cobook-checkout-intercepted', handler);
    return () => window.removeEventListener('cobook-checkout-intercepted', handler);
  }, [session, profile]);

  useEffect(() => {
    try {
      if (session) chrome.storage.local.set({ [STORAGE_KEY]: session });
      else chrome.storage.local.remove(STORAGE_KEY);
    } catch (_) {}
  }, [session]);

  const handleCreateSession = async () => {
    if (!user) return;
    setError('');
    
    if (!adapterRules) {
      setError('SplitSync rules for this site are loading or unavailable.');
      return;
    }

    const scrapedData = await extractPropertyData(adapterRules);
    const cost = scrapedData.total_price || 0;
    const currentDomain = getDomainForCurrentPage();

    const { data: sessionData, error: sErr } = await supabase.from('sessions').insert({
      host_id: user.id,
      platform: currentDomain,
      property_title: scrapedData.title || 'Travel Property',
      property_url: window.location.href,
      total_cost: Number(cost),
      status: 'browsing',
    }).select().single();

    if (sErr) { setError(`Failed: ${sErr.message}`); return; }

    await supabase.from('session_members').insert({ session_id: sessionData.id, user_id: user.id, amount_owed: cost, payment_status: 'paid' });
    setSession(sessionData);
    setScreen('lobby');
  };

  const handleJoinSession = async (sessionId) => {
    setError('');
    const { data: sessionData, error: sErr } = await supabase.from('sessions').select('*').eq('id', sessionId.trim()).maybeSingle();
    if (sErr || !sessionData) { setError('Session not found.'); return; }
    
    await supabase.from('session_members').upsert({ session_id: sessionId, user_id: user.id, amount_owed: 0, payment_status: 'pending' }, { onConflict: 'session_id,user_id' });
    setSession(sessionData);
    setScreen(sessionData.status === 'locked_for_payment' ? 'payment' : 'lobby');
  };

  const handleShortlistProperty = async () => {
    if (!session || !user || !adapterRules) return;
    const scrapedData = await extractPropertyData(adapterRules);
    await supabase.from('shortlisted_properties').insert({
      session_id: session.id,
      added_by: user.id,
      property_title: scrapedData.title || 'Travel Property',
      property_url: window.location.href,
      price: scrapedData.total_price || 0
    });
  };

  const handleVote = async (propId, voteType) => {
    const prop = shortlisted.find(p => p.id === propId);
    if (!prop) return;
    let ups = [...(prop.upvotes || [])];
    let downs = [...(prop.downvotes || [])];
    ups = ups.filter(id => id !== user.id);
    downs = downs.filter(id => id !== user.id);
    if (voteType === 'up') ups.push(user.id);
    if (voteType === 'down') downs.push(user.id);
    await supabase.from('shortlisted_properties').update({ upvotes: ups, downvotes: downs }).eq('id', propId);
  };

  const handleSelectFromShortlist = async (prop) => {
    if (session.host_id !== user.id) return;
    await supabase.from('sessions').update({ property_title: prop.property_title, property_url: prop.property_url, total_cost: prop.price }).eq('id', session.id);
  };

  const isHost = session?.host_id === user?.id;
  const screenTitle = { loading: 'SplitSync', onboarding: 'Setup', idle: 'SplitSync', lobby: 'Lobby', payment: 'Split', success: 'Done', settings: 'Settings' };

  return (
    <div className="fixed bottom-4 right-4 z-[2147483647] font-sans" style={{ width: '320px' }}>
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center px-4 py-3 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <span className="text-sm">??</span>
            <span className="text-white font-bold text-sm">{screenTitle[screen]}</span>
          </div>
          <button onClick={() => setMinimized(m => !m)} className="text-neutral-500 hover:text-white transition-colors">
            {minimized ? '?' : '?'}
          </button>
        </div>

        {!minimized && (
          <div className="p-4">
            {error && <div className="mb-3 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-2">{error}</div>}
            {screen === 'loading' && <LoadingScreen />}
            {screen === 'onboarding' && <OnboardingScreen onComplete={(data) => { saveProfile(user.id, data); setScreen('idle'); }} />}
            {screen === 'idle' && <IdleScreen profile={profile} onCreateSession={handleCreateSession} onJoinSession={handleJoinSession} />}
            {screen === 'lobby' && (
              <div className="flex flex-col gap-4">
                <LobbyScreen session={session} members={members} profile={profile} myUserId={user?.id} onLockForPayment={() => setScreen('payment')} onLeave={() => { setSession(null); setScreen('idle'); }} />
                <div className="border-t border-neutral-800 pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest">Voting Board</p>
                    <button onClick={handleShortlistProperty} className="text-[10px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded hover:bg-emerald-500/20 transition-all">+ Add Current</button>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {shortlisted.map(prop => (
                      <div key={prop.id} className="bg-neutral-800/50 border border-neutral-700/50 rounded-lg p-2">
                        <p className="text-xs text-white font-medium truncate mb-1">{prop.property_title}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-neutral-400">?{Number(prop.price).toLocaleString()}</span>
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleVote(prop.id, 'up')} className={`text-[10px] px-1.5 py-0.5 rounded border ${prop.upvotes?.includes(user?.id) ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'border-neutral-700 text-neutral-500'}`}>?? {prop.upvotes?.length || 0}</button>
                            <button onClick={() => handleVote(prop.id, 'down')} className={`text-[10px] px-1.5 py-0.5 rounded border ${prop.downvotes?.includes(user?.id) ? 'bg-red-500/20 border-red-500 text-red-400' : 'border-neutral-700 text-neutral-500'}`}>?? {prop.downvotes?.length || 0}</button>
                            {isHost && <button onClick={() => handleSelectFromShortlist(prop)} className="text-[10px] bg-neutral-700 text-white px-2 py-0.5 rounded ml-1">Select</button>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {screen === 'payment' && session && <PaymentScreen session={session} members={members} myUserId={user?.id} onMarkPaid={async (id) => { await supabase.from('session_members').update({ payment_status: 'paid' }).eq('session_id', session.id).eq('user_id', id); }} onUnlockCheckout={async () => { await supabase.from('sessions').update({ status: 'completed' }).eq('id', session.id); setScreen('success'); }} />}
            {screen === 'success' && session && <SuccessScreen session={session} members={members} onDone={() => { setSession(null); setScreen('idle'); }} />}
            {screen === 'settings' && <SettingsScreen profile={profile} onSave={(data) => { saveProfile(user.id, data); setScreen('idle'); }} onBack={() => setScreen('idle')} />}
          </div>
        )}
      </div>
    </div>
  );
}
