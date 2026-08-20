# Business Matchmaking App — CLAUDE.md

## Commands

- **Dev:** `npm run dev`
- **Build:** `npm run build` (TypeScript compile + Vite build → `dist/`)
- **Test:** `npm test` (Vitest, single run)
- **Test watch:** `npm run test:watch`
- **Lint:** `npm run lint` (oxlint)
- **Preview:** `npm run preview`

## Architecture

InfoComm India 2026 visitor-tracking PWA for a 3-day exhibition.

**Stack:** React 19, Vite 8, TypeScript, Tailwind CSS v3, vite-plugin-pwa, Supabase, Dexie.js (IndexedDB), react-router-dom v7, Vitest + Testing Library.

**Two user roles:**
- Visitor — registers/logs in via Supabase Auth, checks in at exhibitor booths (PIN entry), views the leaderboard.
- Organizer — PIN-protected dashboard with exhibitor management, live visit feed, analytics, lucky draw, CSV export.

**Local-first:** All visits are written to Dexie (IndexedDB) first and synced to Supabase when online. `useOnlineStatus` detects connectivity; `sync.ts` handles the push.

**Key directories:**
- `src/pages/visitor/` — visitor flows (Register, Login, ExhibitorList, CheckIn, Leaderboard)
- `src/pages/organizer/` — organizer dashboard (Login, Exhibitors, VisitFeed, Analytics, LuckyDraw)
- `src/lib/` — db (Dexie), supabase client, sync, scoring, pins, export, eventDay
- `src/hooks/` — useAuth, useVisits, useExhibitors, useOnlineStatus
- `src/guards/` — OrganizerRoute, VisitorRoute (route protection)
- `src/router.tsx` — createBrowserRouter routes

**Deployment:** Vercel. `vercel.json` rewrites all routes to `/index.html` for client-side routing. Static assets under `/assets/` are cached immutably for one year.

## Notes

- `vite.config.ts` imports `defineConfig` from `vitest/config` (not `vite`) to enable the `test` block without TS errors.
- Tailwind v3 — config is `tailwind.config.ts` with `satisfies Config`.
- Brand color: primary `#7B2D8B`.
- `.env.local` — Supabase URL and anon key (fill before deploying).
