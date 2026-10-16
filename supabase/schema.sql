-- =====================================================================
-- STEP 2: Database (paste into Supabase -> SQL Editor -> New query -> Run)
-- Safe to run once. Tables: profiles, listings, bookings
-- =====================================================================

create extension if not exists btree_gist;

-- ---------- 1. PROFILES (one row per signed-up user) ----------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text,
  full_name   text,
  created_at  timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- users who signed up before this script ran
insert into public.profiles (id, email)
select id, email from auth.users
on conflict (id) do nothing;

-- ---------- 2. LISTINGS (stays / items people can book) ----------
create table if not exists public.listings (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  description      text,
  city             text not null,
  country          text not null default 'India',
  price_per_night  integer not null check (price_per_night > 0),
  max_guests       integer not null default 2 check (max_guests > 0),
  rating           numeric(2,1) check (rating between 0 and 5),
  image_url        text,
  created_at       timestamptz not null default now()
);
create index if not exists listings_city_idx on public.listings (city);

-- ---------- 3. BOOKINGS (with double-booking protection) ----------
create table if not exists public.bookings (
  id           uuid primary key default gen_random_uuid(),
  listing_id   uuid not null references public.listings (id) on delete cascade,
  user_id      uuid not null references auth.users (id) on delete cascade,
  check_in     date not null,
  check_out    date not null,
  guests       integer not null default 1 check (guests > 0),
  total_price  integer not null check (total_price >= 0),
  status       text not null default 'confirmed'
               check (status in ('confirmed', 'cancelled')),
  created_at   timestamptz not null default now(),
  constraint bookings_dates_valid check (check_out > check_in),
  -- The database itself refuses overlapping confirmed stays for one listing,
  -- even if two users click "Book" at the same millisecond.
  -- [check_in, check_out) means back-to-back stays are allowed.
  constraint bookings_no_double_booking exclude using gist (
    listing_id with =,
    daterange(check_in, check_out, '[)') with &&
  ) where (status = 'confirmed')
);
create index if not exists bookings_user_idx on public.bookings (user_id);

-- ---------- 4. ROW LEVEL SECURITY ----------
alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.bookings enable row level security;

drop policy if exists "profiles: read own"   on public.profiles;
drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: read own" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "profiles: update own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy if exists "listings: public read" on public.listings;
create policy "listings: public read" on public.listings
  for select to anon, authenticated using (true);

drop policy if exists "bookings: read own" on public.bookings;
create policy "bookings: read own" on public.bookings
  for select to authenticated using (user_id = (select auth.uid()));
-- No insert/update/delete policies on bookings on purpose:
-- all writes go through the functions below, so the price is computed
-- on the server and users cannot tamper with it.

-- Explicit table permissions (RLS above still decides which rows are visible).
grant select on public.listings to anon, authenticated;
grant select on public.bookings to authenticated;
grant select, update on public.profiles to authenticated;
revoke insert, update, delete on public.listings from anon, authenticated;
revoke insert, update, delete on public.bookings from anon, authenticated;

-- ---------- 5. FUNCTIONS (called from the app with supabase.rpc) ----------
create or replace function public.create_booking(
  p_listing_id uuid,
  p_check_in   date,
  p_check_out  date,
  p_guests     integer default 1
)
returns public.bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user     uuid := auth.uid();
  v_listing  public.listings;
  v_booking  public.bookings;
  v_nights   integer;
begin
  if v_user is null then
    raise exception 'You must be logged in' using errcode = '28000';
  end if;
  if p_check_in is null or p_check_out is null or p_check_out <= p_check_in then
    raise exception 'Check-out must be after check-in' using errcode = '22023';
  end if;
  if p_check_in < current_date then
    raise exception 'Check-in cannot be in the past' using errcode = '22023';
  end if;

  select * into v_listing from public.listings where id = p_listing_id;
  if not found then
    raise exception 'Listing not found' using errcode = 'P0002';
  end if;
  if p_guests < 1 or p_guests > v_listing.max_guests then
    raise exception 'Guests must be between 1 and %', v_listing.max_guests
      using errcode = '22023';
  end if;

  v_nights := p_check_out - p_check_in;

  insert into public.bookings (listing_id, user_id, check_in, check_out, guests, total_price)
  values (p_listing_id, v_user, p_check_in, p_check_out, p_guests,
          v_nights * v_listing.price_per_night)
  returning * into v_booking;

  return v_booking;
exception
  when exclusion_violation then
    raise exception 'Those dates are no longer available' using errcode = 'P0001';
end;
$$;

create or replace function public.cancel_booking(p_booking_id uuid)
returns public.bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_booking public.bookings;
begin
  update public.bookings
     set status = 'cancelled'
   where id = p_booking_id
     and user_id = auth.uid()
     and status = 'confirmed'
  returning * into v_booking;

  if not found then
    raise exception 'Booking not found or already cancelled' using errcode = 'P0002';
  end if;
  return v_booking;
end;
$$;

revoke all on function public.create_booking(uuid, date, date, integer) from public, anon;
revoke all on function public.cancel_booking(uuid) from public, anon;
grant execute on function public.create_booking(uuid, date, date, integer) to authenticated;
grant execute on function public.cancel_booking(uuid) to authenticated;

-- ---------- 6. SEED DATA (only if listings is empty) ----------
do $$
begin
  if not exists (select 1 from public.listings) then
    insert into public.listings (title, description, city, price_per_night, max_guests, rating) values
      ('Sea-view Studio near Calangute', 'Bright studio, 5 min walk to the beach, balcony and fast Wi-Fi.', 'Goa', 3200, 2, 4.6),
      ('Heritage Haveli Suite', 'Restored haveli room with courtyard breakfast, close to the City Palace.', 'Jaipur', 4100, 3, 4.8),
      ('Skyline Apartment, Bandra', 'Modern 1BHK with sea glimpses, minutes from cafes and the Sea Link.', 'Mumbai', 6800, 3, 4.4),
      ('Garden Cottage in Indiranagar', 'Quiet cottage with a work desk, near metro and restaurants.', 'Bengaluru', 3900, 2, 4.5),
      ('Mountain Lodge, Old Manali', 'Wooden lodge with valley views, bonfire evenings and a heater.', 'Manali', 2800, 4, 4.7),
      ('Backwater Houseboat Stay', 'Private houseboat room with meals included, sunset cruise on request.', 'Kochi', 5200, 2, 4.9),
      ('Nawabi Courtyard Rooms', 'Comfortable family rooms near Hazratganj with home-style food.', 'Lucknow', 2400, 4, 4.3),
      ('Business Suite, Connaught Place', 'Central suite with workspace, 2 minutes from the metro.', 'Delhi', 5600, 2, 4.2);
  end if;
end $$;
