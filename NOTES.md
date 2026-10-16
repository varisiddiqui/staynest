# Project notes (keep this updated: it is the handoff doc)

## Status
Working:
- Auth (signup / login / logout) with Supabase, session refresh in `proxy.ts`
- Listings page: search, city, max price, guests, sort (filters live in the URL)
- Listing detail page `/listings/[id]` with booking form (dates + guests, price preview)
- Booking via the `create_booking` database function (server-side price, no double-booking)
- Dashboard "My trips" with cancel via `cancel_booking`

Not done yet:
- Navbar shared across pages
- Listing images (cards use a gradient placeholder when `image_url` is empty)
- Problem-statement specific features (add below once Round 2 PS is released)

## Architecture in one minute
- Next.js 16 App Router, `cacheComponents: true`. Anything that reads cookies or
  URL params must sit inside `<Suspense>`.
- Database logic lives in Supabase (`supabase/schema.sql`). The app calls
  `supabase.rpc("create_booking" | "cancel_booking")`; it never inserts into
  `bookings` directly (RLS blocks it on purpose).
- Server Actions: `app/listings/[id]/actions.ts`, `app/dashboard/actions.ts`.
- Data helpers: `lib/listings.ts`, `lib/bookings.ts`. Types: `lib/types.ts`.

## Setup
1. `cp .env.example .env.local` and fill in the Supabase URL + anon key.
2. Run `supabase/schema.sql` in Supabase -> SQL Editor (safe to re-run).
3. `npm install` then `npm run dev`.

## Next ideas
- Adapt listings/bookings to the Round 2 problem statement
- Reviews, favourites, host dashboard, image upload
- Deploy to Vercel (add the two env vars there)
