-- ============================================================
-- CoBook Supabase SQL Schema (with Anonymous Auth RLS)
-- Run this entire file in your Supabase SQL Editor
-- ============================================================

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  name        TEXT NOT NULL,
  upi_id      TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Anyone (anon or permanent) can read profiles — needed to show names in sessions
CREATE POLICY "profiles_select_all" ON public.profiles
  FOR SELECT USING (true);

-- Only the owner can insert their own profile
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Only the owner can update their own profile
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);


-- 2. SESSIONS
CREATE TABLE IF NOT EXISTS public.sessions (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  host_id         UUID REFERENCES public.profiles(id) NOT NULL,
  platform        TEXT NOT NULL,
  property_title  TEXT,
  property_url    TEXT NOT NULL,
  total_cost      NUMERIC(12, 2) DEFAULT 0.00,
  status          TEXT DEFAULT 'browsing',   -- browsing | locked_for_payment | completed
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Anyone in a session (anon or permanent) can read sessions
CREATE POLICY "sessions_select_all" ON public.sessions
  FOR SELECT USING (true);

-- Any authenticated user (including anonymous) can create a session
CREATE POLICY "sessions_insert_auth" ON public.sessions
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- RESTRICTIVE: Only the host can update a session
-- Using restrictive to ensure this check is ALWAYS enforced
CREATE POLICY "sessions_update_host_only" ON public.sessions AS RESTRICTIVE
  FOR UPDATE USING (auth.uid() = host_id);


-- 3. SESSION MEMBERS (the payment ledger)
CREATE TABLE IF NOT EXISTS public.session_members (
  session_id      UUID REFERENCES public.sessions(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount_owed     NUMERIC(12, 2) DEFAULT 0.00,
  payment_status  TEXT DEFAULT 'pending',   -- pending | paid
  joined_at       TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  PRIMARY KEY (session_id, user_id)
);

ALTER TABLE public.session_members ENABLE ROW LEVEL SECURITY;

-- Anyone can read member rows (needed for real-time sync)
CREATE POLICY "members_select_all" ON public.session_members
  FOR SELECT USING (true);

-- Any authenticated user (including anonymous) can join a session
CREATE POLICY "members_insert_auth" ON public.session_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RESTRICTIVE: Users can only update their OWN payment status
CREATE POLICY "members_update_own_only" ON public.session_members AS RESTRICTIVE
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete themselves from a session (leave)
CREATE POLICY "members_delete_own" ON public.session_members
  FOR DELETE USING (auth.uid() = user_id);

-- Extra: Host can also update any member's amount_owed (for recalculating splits)
-- This needs a non-restrictive companion so the restrictive policy above doesn't block the host
CREATE POLICY "members_update_host" ON public.session_members
  FOR UPDATE USING (
    auth.uid() = (SELECT host_id FROM public.sessions WHERE id = session_id)
  );


-- ============================================================
-- SUPABASE REALTIME
-- Enable realtime for WebSocket hooks
-- ============================================================
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.sessions;
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'sessions is already in supabase_realtime — skipping.';
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.session_members;
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'session_members is already in supabase_realtime — skipping.';
  END;
END $$;


-- ============================================================
-- ANONYMOUS USER CLEANUP (run periodically via a cron job or manually)
-- Deletes anonymous users who never converted, older than 30 days
-- ============================================================
-- delete from auth.users
-- where is_anonymous is true and created_at < now() - interval '30 days';


-- ============================================================
-- SETUP CHECKLIST
-- ============================================================
-- [1] Run this SQL in Supabase Dashboard → SQL Editor
-- [2] Enable Anonymous sign-ins:
--     Dashboard → Authentication → Providers → Anonymous → Enable
-- [3] (Recommended) Enable Invisible Captcha for Anonymous sign-ins:
--     Dashboard → Authentication → Settings → Enable Captcha
--     (Prevents abuse / database bloat from bot sign-ins)
-- [4] Load the extension from extension/dist/ in Chrome
-- ============================================================
