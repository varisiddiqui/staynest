# HackCellence Stays

A stay-booking web app: browse listings, book dates, and manage your trips.

**Stack:** Next.js 16 (App Router), React 19, Tailwind CSS 4, shadcn/ui, Supabase (Auth + Postgres).

## Features
- Email/password signup and login
- Search and filter stays by keyword, city, price and guests
- Listing detail page with date picker and live price estimate
- Booking with double-booking protection enforced in the database
- "My trips" dashboard with cancellation

## Run locally
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create `.env.local` from the example and fill in your Supabase values:
   ```bash
   cp .env.example .env.local
   ```
3. In Supabase, open **SQL Editor** and run `supabase/schema.sql` (creates tables, security rules, booking functions and sample listings).
4. Start the dev server and open http://localhost:3000:
   ```bash
   npm run dev
   ```

## Project layout
- `app/` pages and server actions
- `components/` UI components
- `lib/` Supabase clients and data helpers
- `supabase/schema.sql` database schema

See `NOTES.md` for current status and next steps.
