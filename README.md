# AST NEXT ⚡

A fresh, mobile-first redesign of the AST multi-sport tournament app — plan sports,
vote on location & dates, and run a live scoreboard. Plain HTML/CSS/JS (React via CDN),
so it deploys to **GitHub Pages** with no build step, and syncs live across every device
with **Supabase**.

## Run it locally
Just open `index.html` in a browser, or serve the folder:
```
python3 -m http.server 8000   # then visit http://localhost:8000
```
Out of the box it runs in **Local mode** (data saved in your browser, synced across tabs)
so it works immediately — no setup required.

## Deploy to GitHub Pages
1. Push these files to a repo.
2. Settings → Pages → Source: `main` branch, `/ (root)`.
3. Visit the published URL. Done.

## Turn on live sync (Supabase)
1. Create a project at [supabase.com](https://supabase.com).
2. SQL editor → paste **`schema.sql`** → Run. (Creates tables, seeds players/events,
   sets permissive policies, enables realtime.)
3. Project Settings → API → copy your **Project URL** and **anon public key**.
4. Open **`store.js`** and fill in the two values at the top:
   ```js
   const SUPABASE_URL      = "https://xxxx.supabase.co";
   const SUPABASE_ANON_KEY = "eyJhbGci...";
   ```
5. Reload. The header pill flips from **LOCAL** to **● LIVE** — every vote and score now
   updates in real time on all devices.

## Files
| File | Purpose |
|------|---------|
| `index.html` | Shell — fonts, scripts, mount point |
| `styles.css` | Design system (light + dark) |
| `store.js` | Data layer — **Supabase config lives here**, with localStorage fallback |
| `components.jsx` | Shared UI (header, nav, avatars, icons) |
| `screens.jsx` | Plan · Results · Scoreboard |
| `app.jsx` | App root, routing, theme/accent tweaks |
| `schema.sql` | Supabase tables + policies + realtime |

## Customize
- **Players / events:** edit the seed lists in `store.js` (local) or `schema.sql` (Supabase).
- **Accent color & light/dark:** built into the in-app **Tweaks** panel, or change
  `--accent` in `styles.css`.
