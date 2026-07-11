# Changes in this update

## Bug fixes
- `server/src/routes/user.routes.ts` — fixed import of `user.controllers` (was `user.controller`, would fail to build on case-sensitive systems/CI).
- `client/src/types/index.ts` — fixed `Internship`/enum types to actually match the Prisma schema (was using lowercase enum values and wrong field names like `skillsRequired` instead of `skillsReq`; this would have silently broken filtering/UI once you built the dashboard).

## New backend code
- `server/src/lib/AppError.ts`, `server/src/lib/asyncHandler.ts` — typed errors + no more try/catch boilerplate in controllers.
- `server/src/middleware/errorHandler.ts` — rewritten to return correct status codes (401/404/409) instead of always 500, and to handle Prisma-specific errors (unique constraint, not found).
- `server/src/middleware/validate.ts` + `server/src/validators/*.ts` — zod validation on register/login/updateProfile. Bad requests now get a clean 400 with field-level errors instead of hitting Prisma with garbage data.
- `server/src/middleware/rateLimit.ts` — 10 attempts / 15 min on `/auth/login` and `/auth/register`.
- `server/src/controllers/auth.controller.ts`, `server/src/controllers/user.controllers.ts` — rewritten to use the above.
- `server/src/services/ai.service.ts` — calls Groq (your `GROQ_API_KEY` is already in `.env`) to score student-internship fit, returns `fitScore`, `matchReasons`, `missingSkills`.
- `server/src/controllers/ai.controller.ts` + `POST /api/internships/:id/analyze` route — caches results in `AiAnalysis` so you're not re-calling the LLM on every page view. Pass `?refresh=true` to force a recompute.
- `server/src/ingestion/adapters/types.ts`, `htmlListing.adapter.ts`, `runner.ts` — ingestion pipeline scaffold + a working `demoAdapter` you can run today (`npm run ingest`) to test the upsert/dedup/ScrapeLog flow end to end before writing real scrapers.
- `server/src/ingestion/adapters/drdo.adapter.ts` — a real first adapter against `drdo.gov.in/drdo/en/offerings/vacancies`. Fetches 3 pages, filters to postings whose text contains "intern" (the listing mixes in JRF/apprenticeship/walk-in notices too), parses Advertisement No / Published Date / End Date, and dedupes on `applyUrl`. It's selector-independent (anchors on the "View More" link text rather than guessing Drupal class names) since I fetched the page through a markdown converter and couldn't inspect the real DOM — if it comes back with 0 results, open the page in a browser, inspect one row's HTML, and swap in real CSS selectors following the pattern in `htmlListing.adapter.ts`.
- `prisma/schema.prisma` — added `@unique` to `Internship.applyUrl` (needed so ingestion can upsert without creating duplicates on re-runs).

## New frontend code
- `client/src/pages/Dashboard.tsx` — actually fetches internships now: search, type filter, remote-only toggle, pagination, save/unsave with optimistic-feeling UI via React Query.
- `client/src/pages/Profile.tsx` — real edit form (name, college, branch, year, skills) wired to `PATCH /api/users/profile`.
- `client/src/lib/internships.ts` — API functions used by Dashboard.
- `client/src/context/AuthContext.tsx` — added `setUser` to the context so Profile can update cached user after saving.
- `client/src/index.css` — added a reusable `.input` utility class.

## What YOU still need to do
1. `cd server && npm install` — pulls in the new deps (`zod`, `express-rate-limit`, `axios`, `cheerio`).
2. `npx prisma migrate dev --name add_applyurl_unique` — applies the new unique constraint on `applyUrl`. Do this before running ingestion.
3. `npx prisma generate` — regenerates the Prisma client types (I couldn't run this in my sandbox — no network access to Prisma's binary CDN — so do it locally).
4. `npm run ingest` (from `server/`) — test the pipeline with the demo adapter, check your DB / Prisma Studio for the new row and a `ScrapeLog` entry.
5. Write your first *real* adapter in `server/src/ingestion/adapters/` (see the comments in `htmlListing.adapter.ts` for how), register it in `runner.ts`.
6. `cd client && npm install` (no new client deps needed, but confirm `lucide-react` is installed — it's already in your `package.json`).
