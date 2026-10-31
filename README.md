# 🏡 StayNest

> **Find a stay. Book it. Host your own.**
> A full-stack stay-booking app (think "mini Airbnb") built with Next.js and Supabase, with real logins, real bookings, and a database that refuses double-bookings.

**🌐 Live demo:** https://hackcellence-app.vercel.app

---

## 📖 How to read this README

| If you want to... | Go to |
| --- | --- |
| See what the app can do | [1. What can it do?](#1--what-can-it-do) |
| Understand how it all fits together | [2. The big picture](#2--the-big-picture-in-60-seconds) |
| Run it on your laptop | [3. Run it locally](#3--run-it-locally) |
| Know what every folder and file is for | [4. The map: every file explained](#4--the-map-every-file-and-folder-explained) |
| Follow one click from button to database | [5. Walkthroughs](#5--follow-the-flow-what-happens-when-you-click) |
| Understand the database and its safety rules | [6. The database](#6--the-database-supabase) |
| Know what to check before a demo | [8. Testing checklist](#8--testing-checklist) |

---

## 1. ✨ What can it do?

**As a guest**
- 🔐 Sign up, log in and log out
- 🔎 Search stays by keyword, city, price, number of guests and **dates**
- 📅 Search "free between 20 and 23 Oct" and see only stays that are actually available
- 🏠 Open a stay and see its photo, price, description and **already-booked dates**
- 🧾 Book it, with a live price preview (nights × price)
- 🧳 See **My trips** on the dashboard and cancel a booking

**As a host** (any user can become one with one click)
- ➕ Add, ✏️ edit and 🗑️ delete your own listings
- 📊 See how many bookings and how much revenue your listings made
- 🛡️ Can't delete a listing that has upcoming bookings

**Behind the scenes**
- 🚫 Two people can't book the same dates, even if they click at the same millisecond
- 💰 The price is calculated on the server, so nobody can tamper with it
- 🔒 Guests can't see each other's bookings
- 🔁 Every `git push` redeploys the live site automatically

---

## 2. 🧠 The big picture in 60 seconds

```
   You (browser)
        │   click "Book now"
        ▼
 ┌───────────────────────┐
 │  Next.js app (Vercel) │   pages, forms, buttons, server actions
 └───────────┬───────────┘
             │   asks the database to do the work
             ▼
 ┌───────────────────────┐
 │  Supabase             │   login system + Postgres database
 │  (database + auth)    │   + the rules that keep data safe
 └───────────────────────┘
```

**The tech, in plain words**

| Tool | What it is | Why we use it |
| --- | --- | --- |
| **Next.js 16** | The framework that builds the website (pages + server code in one project) | Fast, popular, deploys easily |
| **React 19** | The library for building screens out of small pieces called components | Comes with Next.js |
| **Tailwind CSS 4** | Styling by writing class names like `rounded-md p-4` | No separate CSS files to manage |
| **shadcn/ui** | Ready-made, good-looking buttons, cards and inputs | Saves us from designing everything |
| **Supabase** | Hosted Postgres database + login system | Gives us a backend without building one |
| **Vercel** | Hosts the live website | Redeploys on every push to GitHub |
| **TypeScript** | JavaScript with types | Catches mistakes before you run the code |

**One idea worth remembering:** the important rules (no double-booking, correct price, who can do what) live **inside the database**, not in the web pages. Pages can be copied or tampered with; the database is the boss.

---

## 3. 🚀 Run it locally

You need **Node.js 20+** and a free **Supabase** project.

**Step 1: Install**
```bash
npm install
```

**Step 2: Add your Supabase keys**
```bash
cp .env.example .env.local
```
Open `.env.local` and fill in the two values from Supabase → **Project Settings → API**:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

**Step 3: Build the database.** In Supabase open **SQL Editor** and run these three files, in this order (each is safe to run again):
1. `supabase/schema.sql`: tables, security, booking functions, sample listings
2. `supabase/host-migration.sql`: host role and listing management
3. `supabase/availability-migration.sql`: date search and booked dates

**Step 4: Start it**
```bash
npm run dev
```
Open http://localhost:3000 🎉

**Useful commands**

| Command | What it does |
| --- | --- |
| `npm run dev` | Starts the app for development (auto-reloads) |
| `npm run build` | Makes the production version (strict, so it catches more problems) |
| `npm run lint` | Checks the code for mistakes and style issues |

---

## 4. 🗺️ The map: every file and folder explained

```
hackcellence-app/
├── app/             ← 📄 the pages (each folder = a web address)
├── components/      ← 🧩 reusable screen pieces
│   └── ui/          ← 🎨 basic building blocks (button, card, input...)
├── lib/             ← 🧰 the "brain": data fetching, helpers, Supabase setup
│   └── supabase/    ← 🔌 connections to Supabase
├── supabase/        ← 🗄️ SQL files that build the database
├── public/          ← 🖼️ static files (images, icons)
├── proxy.ts         ← 🚦 the doorman that runs before every page
└── (config files)   ← ⚙️ settings for the tools
```

### 📄 `app/`: the pages

In Next.js, **a folder inside `app/` becomes a web address**, and the `page.tsx` inside it is what shows up. A file called `actions.ts` holds **server actions**: code that runs on the server when a form is submitted.

| Path | Address | What it does |
| --- | --- | --- |
| `layout.tsx` | every page | The frame around every page: loads the font, sets the page title, and shows the navbar at the top |
| `globals.css` | every page | The colours, fonts and base styling for the whole site |
| `page.tsx` | `/` | The home page with buttons to browse, log in and sign up |
| `favicon.ico` | | The little icon in the browser tab |
| `login/page.tsx` | `/login` | Login screen (uses `AuthForm`) |
| `signup/page.tsx` | `/signup` | Signup screen (uses `AuthForm`) |
| `listings/page.tsx` | `/listings` | The search page: filters on top, a grid of stays below, with loading skeletons |
| `listings/[id]/page.tsx` | `/listings/abc123` | One stay's detail page: photo, description, booked dates, booking form |
| `listings/[id]/actions.ts` | | The **book** action: sends your dates to the database's `create_booking` function |
| `listings/[id]/not-found.tsx` | | The friendly "Stay not found" page for bad addresses |
| `dashboard/page.tsx` | `/dashboard` | **My trips**: your bookings with a Cancel button, plus messages like "Booking confirmed!" |
| `dashboard/actions.ts` | | The **cancel** action: calls the database's `cancel_booking` function |
| `host/page.tsx` | `/host` | Host dashboard: stats, your listings, bookings on them. Non-hosts see a "Become a host" button |
| `host/new/page.tsx` | `/host/new` | The "Add a listing" page |
| `host/[id]/edit/page.tsx` | `/host/abc123/edit` | Edit or delete one of your listings |
| `host/actions.ts` | | All host actions: become host, create, update, delete listing |

> 💡 **What does `[id]` mean?** Square brackets mean "this part of the address changes". One file, `listings/[id]/page.tsx`, serves every stay: `/listings/<any id>`.

### 🧩 `components/`: reusable pieces

Small screen parts that pages put together, like Lego bricks.

| File | What it does |
| --- | --- |
| `navbar.tsx` | The top bar. Shows Stays, plus Log in / Sign up when logged out, or My trips / Host / Log out when logged in |
| `auth-form.tsx` | The login and signup form (one component, two modes) |
| `sign-out-button.tsx` | The Log out button |
| `listing-card.tsx` | One stay in the search grid: photo, title, city, rating, price. Passes your dates on to the detail page |
| `listings-filters.tsx` | The search form (keyword, city, dates, guests, price, sort). Its values live in the web address, so search results can be shared as links |
| `date-range-fields.tsx` | The check-in / check-out pair used in the search form. Greys out dates before check-in as you pick |
| `listings-skeleton.tsx` | Grey placeholder shapes shown while results load |
| `booking-form.tsx` | The form on the detail page: dates, guests, live price, and a warning if your dates overlap an existing booking |
| `listing-form.tsx` | The shared form for adding and editing a listing |

### 🎨 `components/ui/`: basic building blocks

These come from **shadcn/ui** (a library of ready-made pieces) and are used all over the app: `button.tsx`, `card.tsx`, `input.tsx`, `label.tsx`, `skeleton.tsx`. There is also `dialog.tsx` (a pop-up window) which we installed but haven't used yet; it's there if we need it.

### 🧰 `lib/`: the brain

No screens here, just logic that pages call.

| File | What it does |
| --- | --- |
| `types.ts` | The shapes of our data (`Listing`, `Booking`, and so on), so TypeScript can catch typos |
| `listings.ts` | Everything about finding stays: cleans the search address into safe filters, runs the search, hides stays booked on your dates, loads one listing |
| `bookings.ts` | Loads **your** bookings and the booked date ranges of a stay |
| `host.ts` | Host helpers: who is logged in and are they a host, my listings, bookings on my listings |
| `format.ts` | Turns numbers and dates into friendly text: `5200` → `₹5,200`, `2026-10-20` → `20 Oct 2026` |
| `utils.ts` | A tiny helper (`cn`) for combining style class names |

### 🔌 `lib/supabase/`: connections to Supabase

There are **three** because the app talks to Supabase from three different places:

| File | Used in | Why separate |
| --- | --- | --- |
| `client.ts` | the browser | For things done on your device, like clicking Log in |
| `server.ts` | server code (pages and actions) | Runs on the server and reads your login cookie |
| `proxy.ts` | the doorman (`/proxy.ts`) | Refreshes your login and decides who may enter protected pages |

### 🚦 `proxy.ts` (project root)

The **doorman**. It runs before every page loads and does two jobs:
1. Keeps you logged in by refreshing your session.
2. Protects private pages: not logged in and heading to `/dashboard` or `/host`? You're sent to `/login`. Logged in and heading to `/login`? You're sent to the dashboard.

> (In older Next.js this file was called `middleware.ts`. Version 16 renamed it.)

### 🗄️ `supabase/`: the database blueprints

SQL files you paste into Supabase's SQL Editor. Run them in this order:

| File | What it builds |
| --- | --- |
| `schema.sql` | **The foundation.** Tables (profiles, listings, bookings), the double-booking rule, security rules, the `create_booking` and `cancel_booking` functions, and 8 sample stays |
| `host-migration.sql` | **Hosting.** A role for each user, an owner for each listing, and safe functions to become a host and to create, update and delete listings |
| `availability-migration.sql` | **Dates.** Two read-only functions that tell the app which dates are taken, without revealing who booked |

> "Migration" just means "a change to the database, saved as a file", so changes are repeatable and live in git.

### 🖼️ `public/`

Static files served as they are. These are leftover starter icons (`next.svg`, `vercel.svg` and so on) from the Next.js template. Nothing uses them, so they can be deleted safely.

### ⚙️ Config files (you rarely touch these)

| File | What it does |
| --- | --- |
| `package.json` / `package-lock.json` | The list of libraries the project uses, and their exact versions |
| `next.config.ts` | Next.js settings. We turn on `cacheComponents`, a strict mode that makes us wrap anything user-specific in `<Suspense>` |
| `tsconfig.json` | TypeScript settings, including the `@/` shortcut so we can write `@/lib/format` instead of `../../lib/format` |
| `eslint.config.mjs` | Rules for `npm run lint` |
| `components.json` | Settings for shadcn/ui, telling it where to put new components |
| `.gitignore` | Files git should never upload (`node_modules`, and **`.env.local` with your secret keys**) |
| `.env.example` | A template listing the settings you need. The real `.env.local` is never committed |
| `AGENTS.md` | A note Next.js adds for AI coding tools, warning that this version differs from older ones |
| `NOTES.md` | Our working notes: status, decisions, what's next |

---

## 5. 🔄 Follow the flow: what happens when you click

### 📌 Walkthrough A: booking a stay

1. **You open a stay.** `listings/[id]/page.tsx` asks `lib/listings.ts` for the listing and `lib/bookings.ts` for its booked dates.
2. **You pick dates.** `booking-form.tsx` checks them against the booked ranges in your browser and shows a warning if they overlap.
3. **You click "Book now".** The form calls the **server action** in `listings/[id]/actions.ts`.
4. **The action calls the database** function `create_booking` through `supabase.rpc(...)`.
5. **The database decides.** It checks you're logged in, the dates are valid and in the future, and the guests fit. It calculates the price itself and inserts the booking. If someone just took those dates, the double-booking rule refuses it.
6. **You land on the dashboard** with "Booking confirmed!", and your trip is listed.

### 📌 Walkthrough B: searching by dates

1. You pick dates on `/listings` and click Search. The dates go into the **web address** (`?checkIn=...&checkOut=...`).
2. `listings/page.tsx` reads the address, and `parseFilters` in `lib/listings.ts` cleans it into safe values.
3. `searchListings` asks the database function `unavailable_listing_ids` which stays are booked in that range.
4. Those stays are left out, and the rest are shown.
5. Click a card, and your dates and guest count are passed along, so the booking form is pre-filled.

### 📌 Walkthrough C: becoming a host

1. On `/host` you click **Become a host**. The action in `host/actions.ts` calls the database function `become_host`.
2. Your profile's role changes from `guest` to `host`.
3. You can now add listings. Each is saved through the `create_listing` function, which stamps **you** as the owner.
4. Only the owner can edit or delete it, and that rule is enforced in the database.

### 📌 Walkthrough D: why you stay logged in

Your login is stored in a cookie. On every request, `proxy.ts` asks Supabase "is this cookie still valid?", refreshes it if needed, and redirects you if the page is private.

---

## 6. 🗄️ The database (Supabase)

### Three tables

```
auth.users  (Supabase's own login table)
   │
   ├──< profiles   one per user:  id, email, full_name, role (guest | host)
   │
   ├──< listings   a stay:  title, description, city, country,
   │                        price_per_night, max_guests, rating,
   │                        image_url, host_id (the owner)
   │
   └──< bookings   a booking:  listing_id, user_id, check_in, check_out,
                               guests, total_price, status (confirmed | cancelled)
```

### The safety rules (the clever part)

| Rule | How it's enforced |
| --- | --- |
| **No double-booking** | An *exclusion constraint* on `bookings`: two confirmed bookings for one listing can't have overlapping dates. Back-to-back stays are allowed |
| **Price can't be tampered with** | Nobody can insert into `bookings` directly. They must call `create_booking`, which computes the price itself |
| **Privacy** | Row Level Security (RLS): you only see your own bookings. Hosts also see bookings on *their* listings |
| **Nobody can make themselves a host by hacking** | The `role` column can only change via `become_host` |
| **Only owners change listings** | `update_listing` and `delete_listing` check that you own the listing |
| **No deleting listings with upcoming bookings** | `delete_listing` refuses |
| **Others see dates, not names** | `get_booked_ranges` returns only dates |

> 🔑 **RLS in one line:** it means "even if someone asks the database for everything, it only returns the rows they're allowed to see."

### The database functions

| Function | Who can call it | What it does |
| --- | --- | --- |
| `create_booking` | logged-in users | Validates and books, price calculated server-side |
| `cancel_booking` | logged-in users | Cancels **your own** confirmed booking |
| `become_host` | logged-in users | Makes you a host |
| `create_listing` / `update_listing` / `delete_listing` | hosts (owners) | Manage your listings |
| `get_booked_ranges` | everyone | Booked dates for a listing (no names) |
| `unavailable_listing_ids` | everyone | Which listings are taken on given dates |

---

## 7. 📐 Decisions we made (and why)

- **Price is per listing per night**, up to the max guests, not per person. This is how most stay platforms work.
- **Changing a listing's price or max guests affects new bookings only.** Existing bookings keep their stored price and guest count, because a confirmed booking is a promise.
- **A booking counts nights, not days.** 20 → 23 Oct is **3 nights**. The guest leaves on the morning of the 23rd, so another guest can check in that day.
- **Rules live in the database**, not only in the pages, so they can't be bypassed.
- **Pages that read the logged-in user are wrapped in `<Suspense>`**, and the shared Supabase server client calls `io()` first. This is required by Next.js 16's `cacheComponents` mode.

---

## 8. ✅ Testing checklist

**Availability** (book 20–23 Oct first)
- [ ] Search 20–23, 21–22, 18–21 and 22–25: the stay is **hidden**
- [ ] Search 23–25 and 18–20: the stay **appears**
- [ ] Cancel the booking: the stay comes back
- [ ] The Availability box on the detail page lists the booked range

**Booking form**
- [ ] Overlapping dates show a red warning and a disabled button
- [ ] 20 → 23 shows **3 nights**
- [ ] Guests above the maximum are refused
- [ ] The form is pre-filled when you arrive from a dated search

**Two users** (normal window + private window)
- [ ] Booking the same dates twice: the second says "no longer available"
- [ ] User B can't see user A's trips

**Access control**
- [ ] Logged out: `/dashboard` and `/host` redirect to login
- [ ] A bad address like `/listings/abc` shows "Stay not found"
- [ ] User B can't open user A's `/host/<id>/edit`

**Hosting**
- [ ] Add, edit and delete a listing
- [ ] Deleting a listing with an upcoming booking is refused

---

## 9. 🛣️ What's next

- [ ] 📸 **Image upload** with Supabase Storage (hosts currently paste an image URL)
- [ ] 📈 **Admin analytics**: bookings and revenue charts
- [ ] 💳 **Mock payment step** between "Book now" and "Confirmed"
- [ ] ⭐ **Reviews and ratings**
- [ ] 📱 **Mobile polish**
- [ ] 🧩 **Adapt to the Round 2 problem statement** (the plan: reuse auth, hosts, listings, bookings and availability)

---

## 10. 🆘 If something breaks

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Pages show a Supabase / env error | `.env.local` missing or wrong | Redo Step 2 of [Run it locally](#3--run-it-locally), then restart `npm run dev` |
| Host or date features show errors | A SQL file wasn't run | Run the three SQL files in order |
| Red "blocking prerender / current time" overlay | A page reads the time or user outside `<Suspense>` | Wrap it in `<Suspense>`; server code should go through `lib/supabase/server.ts` |
| Live site works but local doesn't (or the reverse) | Different env vars | Compare `.env.local` with Vercel → **Settings → Environment Variables** |
| Signup email link goes to localhost | Supabase Site URL not set | Supabase → **Authentication → URL Configuration**: set your Vercel URL |
| `LayoutProps` type error in the editor | It's generated when Next runs | Run `npm run dev` once; it disappears |

---

<sub>Built for HackCellence by [@varisiddiqui](https://github.com/varisiddiqui) · Next.js · Supabase · Vercel</sub>
