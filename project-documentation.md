# CoBook: Project Documentation

## Project Structure
The repository is split into two primary domains to ensure separation of concerns and ease of maintenance.

### 1. `extension/` (The Browser Product)
The core product that the users interact with.

- **Stack:** React, Tailwind CSS, Vite (bundled via `@crxjs/vite-plugin`), Supabase v2.
- **Manifest:** V3 configured for `activeTab` and specific host permissions (`*://*.airbnb.com/*`).
- **Content Script (`src/content.jsx`):** 
  - Mounts a Shadow DOM element (`#cobook-extension-root`) onto the target website.
  - Injects embedded CSS ensuring `airbnb.com` stylesheets do not bleed into the UI.
  - Listens to Supabase WebSockets bypassing V3 Background Worker inactivity timeouts.

### 2. `website/` (The Viral Landing Page)
The high-converting, mobile-responsive landing edge designed to kickstart the viral loop.

- **Stack:** React, Tailwind CSS, Framer Motion, Vite.
- **Goal:** Immediately demonstrate the value proposition. Address the "Mobile Trap" (handling users who click session links on mobile where extensions aren't supported) via email drip campaigns or clear instruction flows.
- **Design:** Dark mode, high-contrast, "Glassmorphism" UI previews with real-time mockup animations.

## Core Backend Architecture (Supabase)
This product requires strict ledger capability while maintaining blistering web-socket speeds.

**Database:** PostgreSQL (Supabase)
### Core Tables:
1.  **`profiles`**: Stores user authentication data and critical payment routing info (e.g., `upi_id`).
2.  **`sessions`**: Represents the specific multiplayer booking room. Tracks URL, total cost, and status (e.g., `browsing`, `locked_for_payment`).
3.  **`session_members`**: The ledger. Tracks who is in the room and what they owe (`amount_owed`, `payment_status`).

**Realtime Sync:**
Utilizes Supabase Channel Broadcasts scoped precisely to `session_id=eq.${sessionId}` to keep data payloads isolated and bandwidth negligible.

## Parsing Architecture (Remote Adapters)
To avoid the brittleness of standard web-scraping within extensions, CoBook uses the **Remote Adapter Pattern**. 

1. Extension injects into Airbnb.
2. Extension requests the `airbnb.com` JSON parsing ruleset from the server.
3. Extension executes the ruleset (preferring hidden `meta` tags or `data-testid` attributes over volatile CSS classes) to extract property name, dates, and total price.
4. If Airbnb changes their UI, the server JSON is updated. The extension itself never requires an update push to the Google Chrome Web Store.

## Running the Project
### Extension
```bash
cd extension
npm install
npm run build
# Then load unpacked from extension/dist into Chrome extensions dashboard
```

### Website
```bash
cd website
npm install
npm run dev
# Launches high-speed Vite local dev server at http://localhost:5173 
```
