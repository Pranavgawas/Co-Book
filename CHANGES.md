# SplitSync — Complete Upgrade Guide

## Files to replace

| File in repo | Replace with | Priority |
|---|---|---|
| `extension/src/utils/auth.js` | `auth.js` | 🔴 CRITICAL — fixes silent auth failure |
| `extension/src/Hero.jsx` | `Hero.jsx` | 🔴 CRITICAL — fixes error handling & UX |
| `extension/src/screens/IdleScreen.jsx` | `IdleScreen.jsx` | 🔴 HIGH — demo mode & manual price |
| `extension/src/screens/LobbyScreen.jsx` | `LobbyScreen.jsx` | 🟡 HIGH — WhatsApp invite & better UX |
| `extension/src/popup.jsx` | `popup.jsx` | 🟡 HIGH — demo mode & onboarding |
| `website/src/components/Hero.tsx` | `website-Hero.tsx` | 🟡 HIGH — converts visitors |

---

## What was broken and why it's fixed

### 1. Silent auth failure (CRITICAL)
**Problem:** `ensureAuthenticated()` in auth.js had no timeout — if Supabase was
slow or the anonymous sign-in was blocked by CAPTCHA, the extension hung on
"Loading SplitSync..." forever with no feedback.

**Fix in `auth.js`:**
- Added 10-second auth timeout using `Promise.race()`  
- Added clear CAPTCHA error message in console with exact fix steps
- Wrapped all calls in try/catch — network errors no longer crash the boot
- If auth fails, `authFailed` state is set and user sees a message rather
  than infinite spinner

**IMPORTANT ACTION REQUIRED:**
Go to Supabase Dashboard → Authentication → Settings → CAPTCHA protection
→ make sure CAPTCHA is **DISABLED** for anonymous sign-ins. 
CAPTCHA requires a real browser with DOM access which extensions don't have.

---

### 2. Extension had no value without Airbnb open
**Problem:** First-time users install the extension, open the popup, see
"Navigate to Airbnb to start a session." and close it permanently. Nothing
explains what the product does.

**Fix in `popup.jsx`:**
- Added `DemoMode` component that shows a realistic animated session with
  3 members and a pending payment — visible immediately when no active session
- New users see exactly what the product does before they've done anything

**Fix in `IdleScreen.jsx`:**
- Added `HowItWorks` screen (accessible via "How does SplitSync work? →" link)
- Added site detection: shows "Go to Airbnb or MakeMyTrip" hint when user
  is on a non-supported site
- Added `ManualPriceEntry` fallback when adapter rules haven't loaded yet
  so users can still start a session manually

---

### 3. Scraper silently failing
**Problem:** If `adapterRules` was null when user clicked "Start Group Session",
they saw a generic error and had no path forward.

**Fix in `Hero.jsx`:**
- `handleCreateSession` now accepts an optional `manualPrice` parameter
- If rules are missing, IdleScreen shows `ManualPriceEntry` instead of an error
- Scrape errors are caught individually — if scrape fails, session still
  creates with manually-entered or zero price
- Loading state (`isCreatingSession`) properly disables the button and shows spinner

---

### 4. Invite flow was terrible
**Problem:** Users had to copy a UUID, message their friends "install this
extension, paste this ID into a text box" — 0 of 5 friends will do this.

**Fix in `LobbyScreen.jsx`:**
- Added **WhatsApp share button** that generates a pre-formatted message:
  - Lists the property name
  - Shows each person's exact share amount
  - Includes the session ID in copyable format
  - Links to the website for installation
- Session ID copy still works but is now secondary

---

### 5. Lock requires 2 members — blocks solo testing
**Problem:** `members.length < 2` check prevented hosts from testing the full
payment flow alone.

**Fix in `LobbyScreen.jsx`:**
- Changed `canLock` to `isHost && members.length >= 1` 
- Host can lock a solo session for testing/demo purposes

---

### 6. No error boundary
**Problem:** Any JS error inside the extension would show a blank white panel
with no way to recover.

**Fix in `Hero.jsx`:**
- Added `ErrorBoundary` class component that catches render errors
- Shows "Something went wrong" with a "Try again" button
- Wraps entire extension content

---

### 7. Website CTA was dead
**Problem:** "Add to Chrome — It's Free" button had no `href`. Website hero
didn't demonstrate the product at all.

**Fix in `website-Hero.tsx`:**
- Added `CHROME_STORE_URL` constant (update with your actual store URL)
- `ProductMockup` component is a live animated demo:
  - Cycles through 4 real scenarios (Goa, Bali, Manali, Paris)
  - Shows members paying in real-time with animated status transitions
  - Progress bar fills as members pay
  - "Unlock Booking" button appears when all paid
- Replaced generic copy with specific pain/solution pairs
- Added "How it works" section with numbered steps
- Added testimonials section (placeholder — replace with real ones ASAP)
- Bottom CTA section mentions Pro plan to signal future monetization

---

## Chrome Web Store listing — update these NOW

**Name:** SplitSync — Group Travel & Bill Splitting
**Short description (132 chars):**
Stop fronting money for group trips. Split Airbnb/MakeMyTrip costs instantly. Everyone pays before you book.

**Full description:**
---
STOP BEING THE FRIEND WHO FRONTS THE BILL

Every group trip has one person who puts their card down for everyone and waits weeks to be paid back. SplitSync ends that.

HOW IT WORKS:
1. Open any Airbnb or MakeMyTrip listing
2. Click "Start Group Session" in SplitSync
3. Share your session ID via WhatsApp
4. Friends join, confirm their share, and send you the money
5. Once everyone has paid, the booking button unlocks

FEATURES:
• Auto-detects property price and title
• Real-time sync across all group members
• UPI payment requests generated instantly
• Voting board to shortlist properties as a group
• Session history to track past trips

Works with Airbnb, Airbnb India, and MakeMyTrip. More platforms coming soon.

Free for up to 3 sessions/month.
---

**Screenshots to create:**
1. Popup showing the demo session with animated payments
2. In-page widget on Airbnb showing a locked session with UPI amounts
3. WhatsApp message that gets shared (shows the invite copy)
4. The voting board with 3 shortlisted properties

---

## Where to post for first 100 users (in order)

1. **r/india** — "Built a Chrome extension so I never front money for group trips again"
   Post a 60-second Loom showing the full flow. Be honest it's v1.

2. **r/digitalnomad** — Frame it as the international travel angle (multi-currency)

3. **r/solodev / r/SideProject** — "Show HN: SplitSync — multiplayer travel booking"
   Show the real-time sync aspect, that's technically interesting

4. **LinkedIn (India tech audience)** — Post the "fronted ₹40k" story. 
   Tag it with #travel #startup #chrome

5. **ProductHunt** — Only after you have 10 real reviews on the store.
   ProductHunt traffic means nothing without social proof.

**Script for first post:**
"My friend booked a ₹40,000 Goa villa on his credit card for our group trip.
It took 6 weeks and 20 WhatsApp messages to get paid back.
I built a Chrome extension that makes everyone pay BEFORE you book.
Here's how it works: [Loom link]
Free to install: [Chrome store link]
Would love feedback from anyone planning group trips."

---

## Monetization — implement at 50 users

Don't build this yet. Get users first. When you have 50 active users:

**Option A — Convenience fee (easiest)**
Add a ₹15 flat fee per session collected via Razorpay.
Split across 4 members = ₹3.75 each. No one notices ₹3.75.
At 100 sessions/month = ₹1,500/month. Scales with usage.

**Option B — Pro subscription**  
Free: 3 sessions/month
Pro: ₹99/month — unlimited sessions + payment reminders

Start with Option A. It requires no subscription flow and users pay without
deciding to "subscribe" to something new.

**Razorpay integration steps:**
1. Create Razorpay account (takes 1 day to activate)
2. Add a "confirm booking" step after all members pay
3. Charge the convenience fee to each non-host member
4. Only then trigger the checkout unlock

---

## Quick test checklist before releasing

- [ ] Open extension on Airbnb listing — session creates with correct price
- [ ] Open extension on non-Airbnb page — shows "Go to Airbnb" message
- [ ] Open popup without any session — DemoMode shows animated payment
- [ ] Join session on another device using session ID
- [ ] Lock session → payment screen appears for all members
- [ ] Mark all paid → success screen shows
- [ ] Open popup → trip appears in My Trips
- [ ] Delete trip from My Trips
- [ ] Auth failure (disconnect from internet) → shows error message not spinner
