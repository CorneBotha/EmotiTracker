# EmoTracker — Deploy & Maintenance Guide

## What this is
A Progressive Web App (PWA). Once deployed to a URL, your wife opens it in
Chrome on her Android, taps "Add to Home Screen", and it behaves like a
native app (icon, fullscreen, offline support, auto-updates).

## Architecture (why it's built this way)

```
┌─ UI Layer (src/App.jsx) ─────────┐
│  Views, modals, navigation       │
│  Free to change without risk     │
└───────────┬──────────────────────┘
            │
┌─ Data Layer (src/storage.js) ────┐
│  Schema version + migrations     │
│  Load / save / import / export   │
│  Only file that touches storage  │
└───────────┬──────────────────────┘
            │
┌─ Persistence ────────────────────┐
│  localStorage (browser)          │
│  Future: Supabase cloud sync     │
└──────────────────────────────────┘
```

Rule: **never** call `localStorage` directly from UI code. Always go
through `storage.js`. This is what protects her data across updates.

---

## PHASE 1 — Initial deployment (one-time, ~30 min)

### Prerequisites
- Free GitHub account (github.com)
- Free Vercel account (vercel.com) — sign in with GitHub
- Node.js 18+ installed on your Windows machine (nodejs.org)
- Git installed (git-scm.com)

### Step 1 — Set up locally
```bash
# In the folder containing this project
npm install
npm run dev
```
Open the URL it prints (usually http://localhost:5173) — should work.
Ctrl+C to stop.

### Step 2 — Create GitHub repo
1. On github.com, click **New repository**
2. Name: `emotracker` — set to **Private**
3. Don't tick any init options. Click **Create**
4. Back in your terminal, from the project folder:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/emotracker.git
git push -u origin main
```

### Step 3 — Deploy to Vercel
1. Go to vercel.com, click **Add New → Project**
2. Import your `emotracker` repo
3. Framework: Vite (auto-detected)
4. Click **Deploy** — takes 60 seconds
5. Vercel gives you a URL like `emotracker-abc123.vercel.app`

### Step 4 — Send to your wife
Send her the Vercel URL via WhatsApp. She:
1. Opens it in Chrome on her Android phone
2. Chrome shows a banner: "Add EmoTracker to Home Screen" — she taps it
3. Icon appears on her home screen like any app
4. Tapping it opens fullscreen, no browser chrome

If no banner appears: menu ⋮ → **Install app** / **Add to Home screen**.

### Step 5 (optional) — Custom domain
Vercel → project → **Domains** → add something like `emo.trunek.co.za`.
Vercel handles SSL automatically.

---

## PHASE 2 — Pushing updates (every time you change the app)

This is the workflow that retains her data while upgrading the app:

```bash
# 1. Make your code changes
# 2. Commit and push
git add .
git commit -m "Describe what changed"
git push

# That's it. Vercel auto-deploys in ~60s.
```

**What happens on her phone:**
1. Next time she opens the app, service worker detects new version in background
2. New version is cached silently
3. Next app launch uses the new version
4. **Her localStorage data is untouched** — all previous entries still there

No action required from her.

---

## PHASE 3 — Changing the data shape (critical pattern)

When you add a new field or restructure how entries are stored, you
**must** use a migration. Example: adding a `tags` field to every entry.

### Step 1 — Update `src/storage.js`

```js
// Bump the version
export const SCHEMA_VERSION = 2;

// Add a migration for the new version
const migrations = {
  2: (data) => ({
    ...data,
    entries: data.entries.map(e => ({ ...e, tags: [] }))
  })
};
```

### Step 2 — Use the new field in `App.jsx`
When new entries are created, include `tags: []`. When displaying, read
`entry.tags`.

### Step 3 — Deploy (git push)

On her phone, next app launch:
1. Storage layer loads her data (schema v1)
2. Detects `SCHEMA_VERSION` is now 2
3. Runs migration — adds empty `tags: []` to every existing entry
4. Saves back as v2
5. App opens normally with all her old entries intact + new field ready

**Never skip a migration.** If you jump from v1 to v3 without a v2
migration, users on v1 break. Always add one migration per version bump.

---

## Backup protocol (tell your wife this)

Data lives only in her browser. If she:
- Clears browser data → gone
- Uninstalls Chrome → gone
- Gets a new phone → gone

**Weekly habit:** Settings → Export to JSON file. Save to Google Drive
or email to herself. Takes 3 seconds. If anything happens, Settings →
Import restores everything.

When you move to Phase 4 (Supabase cloud sync), this stops being
necessary — but until then, export discipline matters.

---

## PHASE 4 (future) — Cloud sync with Supabase

When ready to add proper cloud storage (needed before she depends on this long-term):

1. Create free Supabase project (supabase.com)
2. Create `entries` table with the same schema
3. Replace the body of `loadData()` / `saveData()` in `storage.js` with
   Supabase client calls
4. Add simple email/magic-link auth
5. Deploy

**Because `storage.js` is isolated, `App.jsx` doesn't need to change at all.**
The migration framework continues to work — migrations run client-side
after loading from Supabase.

---

## File structure reference

```
emotracker/
├── src/
│   ├── App.jsx          # UI — change freely
│   ├── storage.js       # Data layer — change carefully, use migrations
│   ├── main.jsx         # Entry point — rarely touched
│   └── index.css        # Tailwind — rarely touched
├── public/
│   └── icon.svg         # App icon
├── index.html           # HTML shell with PWA meta tags
├── package.json         # Dependencies
├── vite.config.js       # Build + PWA config
├── tailwind.config.js
├── postcss.config.js
└── DEPLOY.md            # This file
```

## Commands cheat sheet

| Command | What it does |
|---|---|
| `npm install` | Install dependencies (run once after clone) |
| `npm run dev` | Local dev server (hot reload) |
| `npm run build` | Production build (Vercel runs this for you) |
| `git push` | Deploy new version to Vercel |
