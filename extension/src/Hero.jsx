import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { ensureAuthenticated, saveProfile, getProfile } from './utils/auth';
import { extractPropertyData, airbnbRules } from './utils/scraper';
import { usePaymentSync } from './hooks/usePaymentSync';
import { useSessionSync } from './hooks/useSessionSync';

import LoadingScreen from './screens/LoadingScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import IdleScreen from './screens/IdleScreen';
import LobbyScreen from './screens/LobbyScreen';
import PaymentScreen from './screens/PaymentScreen';
import SuccessScreen from './screens/SuccessScreen';
import SettingsScreen from './screens/SettingsScreen';

const STORAGE_KEY = 'cobook_active_session';

// Screens: loading | onboarding | idle | lobby | payment | success | settings
export default function Hero() {
  const [screen, setScreen]       = useState('loading');
  const [user, setUser]           = useState(null);
  const [profile, setProfile]     = useState(null);
  const [session, setSession]     = useState(null);
  const [minimized, setMinimized] = useState(false);
  const [error, setError]         = useState('');

  // Real-time members list
  const members = usePaymentSync(session?.id);
  // Real-time session status (so non-hosts auto-switch when host locks)
  const liveSession = useSessionSync(session?.id);

  // --- BOOT: Auth + Profile + Restore persisted session ---
  useEffect(() => {
    (async () => {
      console.log('[CoBook] 🚀 Boot sequence started...');
      const u = await ensureAuthenticated();
      if (!u) {
        console.error('[CoBook] ❌ Auth failed — anonymous sign-in blocked. Check Supabase Anonymous provider.');
        setScreen('idle'); return;
      }
      setUser(u);
      console.log('[CoBook] 👤 User authenticated. ID:', u.id, '| Anonymous:', u.is_anonymous);

      const p = await getProfile(u.id);
      if (!p || !p.name) {
        console.log('[CoBook] 📝 No profile found → showing onboarding.');
        setScreen('onboarding');
        return;
      }
      setProfile(p);
      console.log('[CoBook] ✅ Profile loaded:', p.name, '| UPI:', p.upi_id);

      // Try to restore an active session from extension storage
      try {
        const stored = await chrome.storage.local.get(STORAGE_KEY);
        const savedSession = stored[STORAGE_KEY];
        console.log('[CoBook] 💾 Stored session:', savedSession ? savedSession.id : 'none');
        if (savedSession) {
          const { data } = await supabase
            .from('sessions')
            .select('*')
            .eq('id', savedSession.id)
            .neq('status', 'completed')
            .maybeSingle();
          if (data) {
            console.log('[CoBook] ♻️ Restored session. Status:', data.status);
            setSession(data);
            setScreen(data.status === 'locked_for_payment' ? 'payment' : 'lobby');
            return;
          } else {
            console.log('[CoBook] 🗑️ Stored session expired — clearing.');
            chrome.storage.local.remove(STORAGE_KEY);
          }
        }
      } catch (storageErr) {
        console.warn('[CoBook] chrome.storage unavailable (dev mode?):', storageErr.message);
      }

      console.log('[CoBook] ✅ Boot complete → idle screen.');
      setScreen('idle');
    })();
  }, []);

  // --- Real-time session status sync (non-host auto-switch to payment) ---
  useEffect(() => {
    if (!liveSession) return;
    // Update the local session object with live data
    setSession(liveSession);
    // Auto-advance screen for non-host members when host locks
    if (liveSession.status === 'locked_for_payment' && screen === 'lobby') {
      setScreen('payment');
      setMinimized(false);
    }
    if (liveSession.status === 'completed' && screen === 'payment') {
      setScreen('success');
    }
  }, [liveSession]);

  // --- Auto-advance to success when all members paid ---
  useEffect(() => {
    if (screen === 'payment' && members.length > 0 && members.every(m => m.payment_status === 'paid')) {
      setScreen('success');
    }
  }, [members, screen]);

  // --- Checkout intercept event from content.jsx ---
  useEffect(() => {
    const handler = () => {
      setMinimized(false);
      if (session) {
        // Session exists → go straight to payment screen
        setScreen('payment');
      } else {
        // No session yet → flash a warning and stay on idle/onboarding
        setError('⚠️ Create a CoBook session first, then everyone can split the cost before booking!');
        setScreen(profile ? 'idle' : 'onboarding');
      }
    };
    window.addEventListener('cobook-checkout-intercepted', handler);
    return () => window.removeEventListener('cobook-checkout-intercepted', handler);
  }, [session, profile]);

  // Persist session to chrome storage whenever it changes
  useEffect(() => {
    try {
      if (session) chrome.storage.local.set({ [STORAGE_KEY]: session });
      else         chrome.storage.local.remove(STORAGE_KEY);
    } catch (_) {}
  }, [session]);

  // --- HANDLERS ---

  const handleOnboardingComplete = async ({ name, upiId }) => {
    await saveProfile(user.id, { name, upiId });
    const p = await getProfile(user.id);
    setProfile(p);
    setScreen('idle');
  };

  const handleSaveSettings = async ({ name, upiId }) => {
    await saveProfile(user.id, { name, upiId });
    const p = await getProfile(user.id);
    setProfile(p);
  };

  const handleCreateSession = async () => {
    if (!user) return;
    setError('');
    const scrapedData = await extractPropertyData(airbnbRules);
    const cost = scrapedData.total_price || 40000;

    const { data: sessionData, error: sErr } = await supabase
      .from('sessions')
      .insert({
        host_id: user.id,
        platform: 'airbnb',
        property_title: scrapedData.title || 'Airbnb Property',
        property_url: window.location.href,
        total_cost: cost,
        status: 'browsing',
      })
      .select().single();

    if (sErr) { setError('Could not create session. Check Supabase setup.'); return; }

    await supabase.from('session_members').insert({
      session_id: sessionData.id,
      user_id: user.id,
      amount_owed: cost,
      payment_status: 'paid',
    });

    setSession(sessionData);
    setScreen('lobby');
  };

  const handleJoinSession = async (sessionId) => {
    setError('');
    const { data: sessionData, error: sErr } = await supabase
      .from('sessions').select('*').eq('id', sessionId.trim()).single();

    if (sErr || !sessionData) { setError('Session not found. Check the ID.'); return; }
    if (sessionData.status === 'completed') { setError('That session has already completed.'); return; }

    await supabase.from('session_members').upsert({
      session_id: sessionId,
      user_id: user.id,
      amount_owed: Math.ceil(sessionData.total_cost / 2),
      payment_status: 'pending',
    }, { onConflict: 'session_id,user_id' });

    setSession(sessionData);
    setScreen(sessionData.status === 'locked_for_payment' ? 'payment' : 'lobby');
  };

  const handleLockForPayment = async () => {
    const perPerson = Math.ceil(session.total_cost / members.length);
    for (const m of members) {
      await supabase.from('session_members')
        .update({ amount_owed: perPerson })
        .eq('session_id', session.id).eq('user_id', m.user_id);
    }
    await supabase.from('sessions').update({ status: 'locked_for_payment' }).eq('id', session.id);
    setSession(prev => ({ ...prev, status: 'locked_for_payment' }));
    setScreen('payment');
  };

  const handleMarkPaid = async (memberId) => {
    await supabase.from('session_members')
      .update({ payment_status: 'paid' })
      .eq('session_id', session.id).eq('user_id', memberId);
  };

  const handleUnlockCheckout = async () => {
    await supabase.from('sessions').update({ status: 'completed' }).eq('id', session.id);
    // Un-lock Airbnb's checkout button
    document.querySelectorAll("button[data-testid='homes-pdp-cta-btn'], button[data-testid='quick-pay-button']")
      .forEach(btn => { btn.style.opacity = '1'; btn.style.cursor = ''; btn.style.pointerEvents = ''; });
    setScreen('success');
  };

  const handleLeave = async () => {
    if (session) {
      await supabase.from('session_members')
        .delete().eq('session_id', session.id).eq('user_id', user.id);
    }
    setSession(null); setScreen('idle');
  };

  const handleDone = () => { setSession(null); setScreen('idle'); };

  // --- UI ---

  const screenTitle = {
    loading: 'CoBook', onboarding: 'Setup Profile', idle: 'CoBook',
    lobby: 'Active Session', payment: 'Split Payment', success: 'All Done!', settings: 'Settings',
  };

  return (
    <div className="fixed bottom-4 right-4 z-[2147483647] font-sans" style={{ width: '320px' }}>
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* ── Header ── */}
        <div className="flex justify-between items-center px-4 py-3 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <span className="text-sm">✈️</span>
            <span className="text-white font-bold text-sm">{screenTitle[screen]}</span>
          </div>
          <div className="flex items-center gap-1">
            {(screen === 'lobby' || screen === 'payment') && (
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full animate-pulse">● Live</span>
            )}
            {/* Settings gear — visible on idle */}
            {screen === 'idle' && profile && (
              <button
                onClick={() => setScreen('settings')}
                className="w-6 h-6 flex items-center justify-center text-neutral-500 hover:text-white transition-colors"
                title="Settings"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            )}
            {/* Minimize toggle */}
            <button
              onClick={() => setMinimized(m => !m)}
              className="w-6 h-6 flex items-center justify-center text-neutral-500 hover:text-white transition-colors"
            >
              {minimized
                ? <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7"/></svg>
                : <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
              }
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        {!minimized && (
          <div className="p-4">
            {error && (
              <div className="mb-3 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-2">
                {error}
              </div>
            )}

            {screen === 'loading'    && <LoadingScreen />}
            {screen === 'onboarding' && (
              <div className="flex flex-col items-center text-center gap-3 py-2">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-2xl">
                  ✈️
                </div>
                <div>
                  <p className="text-white font-bold text-sm">One quick step!</p>
                  <p className="text-neutral-400 text-xs mt-1 leading-relaxed">
                    Click the <strong className="text-white">CoBook icon</strong> in your toolbar to set up your name and UPI ID.
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 w-full">
                  <span className="text-lg">🧩</span>
                  <p className="text-neutral-300 text-xs text-left">Extensions icon → CoBook → Fill in profile → Done!</p>
                </div>
                {/* After user fills profile in popup, this re-checks without a page reload */}
                <button
                  onClick={async () => {
                    if (!user) return;
                    const p = await getProfile(user.id);
                    if (p?.name) {
                      setProfile(p);
                      setScreen('idle');
                    } else {
                      setError('Profile not saved yet — please fill in name and UPI ID in the CoBook popup first.');
                    }
                  }}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-2 rounded-xl text-xs transition-colors"
                >
                  I've set it up! →
                </button>
                <button
                  onClick={() => setMinimized(true)}
                  className="text-neutral-600 text-xs hover:text-neutral-400 transition-colors"
                >
                  Dismiss for now
                </button>
              </div>
            )}
            {screen === 'idle'       && <IdleScreen profile={profile} onCreateSession={handleCreateSession} onJoinSession={handleJoinSession} />}
            {screen === 'settings'   && <SettingsScreen profile={profile} onSave={handleSaveSettings} onBack={() => setScreen('idle')} />}
            {screen === 'lobby'   && session && <LobbyScreen session={session} members={members} profile={profile} myUserId={user?.id} onLockForPayment={handleLockForPayment} onLeave={handleLeave} />}
            {screen === 'payment' && session && <PaymentScreen session={session} members={members} myUserId={user?.id} onMarkPaid={handleMarkPaid} onUnlockCheckout={handleUnlockCheckout} />}
            {screen === 'success' && session && <SuccessScreen session={session} members={members} onDone={handleDone} />}
          </div>
        )}
      </div>
    </div>
  );
}
