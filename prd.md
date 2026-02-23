# Product Requirements Document (PRD): CoBook (Multiplayer Travel Booking)

## 1. Overview & Objective
**The Product:** A Chrome extension that turns single-player travel booking sites (Airbnb, MakeMyTrip, Agoda) into live, multiplayer sessions with built-in expense splitting.
**The Goal:** Reach $1M in Gross Merchandise Volume (GMV) with zero marketing spend by forcing a viral loop where the core utility requires inviting 2-5 new users per session.

## 2. The Problem Statement
Group travel planning is a high-friction, high-anxiety process. It currently requires copying and pasting dozens of links into a group chat, losing track of which dates were selected, and ultimately forcing one person to front $800+ on their credit card for a villa or flights, hoping their friends pay them back.

## 3. Target Audience & Use Cases
**Target:** Millennials and Gen Z planning group trips (e.g., friend groups booking a long weekend in Goa, or couples splitting international flights).

**Core Use Case:** 
User A finds an Airbnb. Instead of sharing the raw link, they click the CoBook extension. It generates a session link. Users B, C, and D click the link, install the extension, and their browsers sync. They can vote on properties, and at checkout, the bill is instantly fractionalized.

## 4. Functional Requirements (The MVP)
To keep the scope manageable for a solo developer, the MVP will be aggressively constrained.

**Platform Support:** Strictly limited to Airbnb and MakeMyTrip for V1.

**Multiplayer Sync:** 
- Create a session and generate an invite link.
- Sync the current "viewed property" across all active session members in real-time.
- Shared "Upvote/Downvote" board overlaid on the host site.

**The Checkout Hijack (The Money Maker):**
- Intercept the native "Confirm and Pay" button on the booking site.
- Trigger the expense-splitting calculation (dividing total cost + taxes by the number of session members).
- Generate instant payment request links (UPI deep links for Indian gateways, or Venmo/CashApp links) for all secondary members.
- Unlock the final checkout button only when the primary buyer confirms receipt of funds.

## 5. Technical Architecture & Constraints
**UI Injection:** A Web Component wrapped in a Shadow DOM injected via a content script. This prevents the host site's aggressive global CSS (e.g., Airbnb) from distorting the CoBook interface.

**Real-Time Engine:** WebSocket connection established directly inside the content script (bypassing Chrome Manifest V3's 30-second service worker limits). Supabase Realtime is used for the backend to ensure relational data integrity (Postgres) and high-speed synced states.

**DOM Parsing (Adapters):** A JSON-based adapter schema hosted on the backend server. When Airbnb updates their CSS classes, the JSON file on the server is updated, not the extension code, preventing the need for constant Chrome Web Store re-reviews.

**Expense Logic:** Core ledger algorithms handle the math cleanly using `NUMERIC(10, 2)` inside PostgreSQL to avoid precision errors.

## 6. Monetization & Viral Loop
**The Viral Engine:** The product cannot function single-player. Every new session created acts as a forced acquisition channel (K-Factor > 1).

**Revenue Stream 1 (Affiliate):** The extension silently routes the final checkout URL through an affiliate network. Capture a 1% to 5% commission on high-ticket group travel bookings.
**Revenue Stream 2 (Convenience Fee):** A flat $2 (or ₹50) micro-fee added to the total split cost for auto-generating the payment routing.

## 7. Success Metrics (KPIs)
- **K-Factor (Virality):** Must be > 1.2. (Every 1 user must successfully bring in at least 1.2 new users).
- **Session-to-Checkout Rate:** Percentage of multiplayer sessions that result in a final, locked-in payment.
- **Adapter Failure Rate:** How often the DOM scrapers fail to find the price/title on supported sites. Needs to be monitored via Sentry.

## 8. Future Scaling (Post-MVP)
- **Mobile Expansion:** Expanding to Android/iOS using a Flutter app interacting with native "Share Sheets".
- **General E-Commerce:** Expanding the JSON adapters to support Amazon, Target, and Walmart once the travel niche is saturated. (Potentially under a rebrand like CartSync or SplitIt).
