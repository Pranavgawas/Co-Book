import { supabase } from '../supabaseClient';

// The key used to share the Supabase session between popup and content script.
// Both run in different localStorage contexts, so we bridge via chrome.storage.local.
const SESSION_STORAGE_KEY = 'SplitSync_supabase_session';

/**
 * Saves the current Supabase session tokens to chrome.storage.local
 * so the content script can restore the same session.
 */
export async function persistSessionToStorage() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await chrome.storage.local.set({
        [SESSION_STORAGE_KEY]: {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        }
      });
      console.log('[SplitSync Auth] 💾 Session saved to chrome.storage for content script sharing.');
    }
  } catch (err) {
    console.warn('[SplitSync Auth] Could not persist session:', err.message);
  }
}

/**
 * Ensures a Supabase session exists.
 * Priority:
 *  1. Already signed in (Supabase's own localStorage for this context)
 *  2. Session saved from popup in chrome.storage.local → restore it
 *  3. Create a new anonymous session as last resort
 */
export async function ensureAuthenticated() {
  console.log('[SplitSync Auth] Checking for session...');

  // ── PRIORITY 1: Session saved from popup via chrome.storage ──────────────
  // The popup and content script have different localStorage contexts.
  // We always defer to the popup's session to ensure the same user ID
  // is used across both contexts.
  try {
    const stored = await chrome.storage.local.get(SESSION_STORAGE_KEY);
    const saved = stored[SESSION_STORAGE_KEY];
    if (saved?.access_token && saved?.refresh_token) {
      console.log('[SplitSync Auth] 🔄 Restoring session from chrome.storage (popup session)...');
      const { data, error } = await supabase.auth.setSession({
        access_token: saved.access_token,
        refresh_token: saved.refresh_token,
      });
      if (!error && data?.user) {
        console.log('[SplitSync Auth] ✅ Session restored. User ID:', data.user.id);
        return data.user;
      }
      // Stored tokens expired — clear them and fall through
      console.warn('[SplitSync Auth] Stored session expired, clearing...');
      await chrome.storage.local.remove(SESSION_STORAGE_KEY);
    }
  } catch (storageErr) {
    console.warn('[SplitSync Auth] chrome.storage unavailable:', storageErr.message);
  }

  // ── PRIORITY 2: Already signed in locally (same context) ─────────────────
  const { data: { session: existing } } = await supabase.auth.getSession();
  if (existing?.user) {
    console.log('[SplitSync Auth] ✅ Local session found. User ID:', existing.user.id);
    return existing.user;
  }

  // ── PRIORITY 3: Create a fresh anonymous session ──────────────────────────
  console.log('[SplitSync Auth] No session found — creating anonymous sign-in...');
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) {
    console.error('[SplitSync Auth] ❌ Anonymous sign-in FAILED:', error.message);
    if (error.message?.toLowerCase().includes('captcha')) {
      console.error('[SplitSync Auth] → Disable CAPTCHA: Supabase Dashboard → Auth → Settings → CAPTCHA → Off');
    }
    return null;
  }
  console.log('[SplitSync Auth] ✅ New anonymous session. User ID:', data.user.id);
  await persistSessionToStorage();
  return data.user;
}

export async function saveProfile(userId, { name, upiId }) {
  console.log('[SplitSync Auth] Saving profile...', { name, upiId });
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: userId, name, upi_id: upiId }, { onConflict: 'id' })
    .select()
    .single();

  if (error) {
    console.error('[SplitSync Auth] ❌ saveProfile FAILED:', error.message, error);
    console.error('[SplitSync Auth] → Check: "profiles" table exists and RLS allows upsert. Run supabase_schema.sql!');
  } else {
    console.log('[SplitSync Auth] ✅ Profile saved:', data);
  }
  return { data, error };
}

export async function getProfile(userId) {
  console.log('[SplitSync Auth] Fetching profile for user:', userId);
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('[SplitSync Auth] ❌ getProfile FAILED:', error.message);
    console.error('[SplitSync Auth] → "profiles" table likely missing. Run supabase_schema.sql in Supabase SQL Editor.');
    return null;
  }

  if (!data) {
    console.log('[SplitSync Auth] ℹ️ No profile row found — first run.');
    return null;
  }

  console.log('[SplitSync Auth] ✅ Profile loaded:', data.name, '| UPI:', data.upi_id);
  return data;
}

