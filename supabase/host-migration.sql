-- =====================================================================
-- HOST MIGRATION (run in Supabase -> SQL Editor -> New query -> Run)
-- Run AFTER schema.sql. Safe to run more than once.
-- Adds: user roles, listing owners, and host-only listing management.
-- =====================================================================

-- ---------- 1. Roles on profiles ----------
alter table public.profiles add column if not exists role text not null default 'guest';
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check check (role in ('guest', 'host'));

-- Users may edit their name, but never their own role through the API.
revoke update on public.profiles from authenticated;
grant update (full_name) on public.profiles to authenticated;

-- ---------- 2. Listing owner ----------
alter table public.listings
  add column if not exists host_id uuid references auth.users (id) on delete set null;
create index if not exists listings_host_idx on public.listings (host_id);

-- Hosts can see bookings made on their own listings.
drop policy if exists "bookings: host read" on public.bookings;
create policy "bookings: host read" on public.bookings
  for select to authenticated
  using (
    exists (
      select 1 from public.listings l
      where l.id = bookings.listing_id
        and l.host_id = (select auth.uid())
    )
  );

-- ---------- 3. Functions (called from the app with supabase.rpc) ----------
create or replace function public.become_host()
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile public.profiles;
begin
  if auth.uid() is null then
    raise exception 'You must be logged in' using errcode = '28000';
  end if;

  update public.profiles set role = 'host'
   where id = auth.uid()
  returning * into v_profile;

  if not found then
    raise exception 'Profile not found' using errcode = 'P0002';
  end if;
  return v_profile;
end;
$$;

create or replace function public.create_listing(
  p_title       text,
  p_description text,
  p_city        text,
  p_country     text,
  p_price       integer,
  p_max_guests  integer,
  p_image_url   text
)
returns public.listings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_listing public.listings;
begin
  if auth.uid() is null then
    raise exception 'You must be logged in' using errcode = '28000';
  end if;
  if not exists (
    select 1 from public.profiles where id = auth.uid() and role = 'host'
  ) then
    raise exception 'Only hosts can add listings' using errcode = '42501';
  end if;
  if coalesce(trim(p_title), '') = '' or coalesce(trim(p_city), '') = '' then
    raise exception 'Title and city are required' using errcode = '22023';
  end if;
  if p_price is null or p_price < 1 or p_max_guests is null or p_max_guests < 1 then
    raise exception 'Price and guests must be at least 1' using errcode = '22023';
  end if;

  insert into public.listings
    (title, description, city, country, price_per_night, max_guests, image_url, host_id)
  values
    (trim(p_title), nullif(trim(p_description), ''), trim(p_city),
     coalesce(nullif(trim(p_country), ''), 'India'),
     p_price, p_max_guests, nullif(trim(p_image_url), ''), auth.uid())
  returning * into v_listing;

  return v_listing;
end;
$$;

create or replace function public.update_listing(
  p_id          uuid,
  p_title       text,
  p_description text,
  p_city        text,
  p_country     text,
  p_price       integer,
  p_max_guests  integer,
  p_image_url   text
)
returns public.listings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_listing public.listings;
begin
  if auth.uid() is null then
    raise exception 'You must be logged in' using errcode = '28000';
  end if;
  if coalesce(trim(p_title), '') = '' or coalesce(trim(p_city), '') = '' then
    raise exception 'Title and city are required' using errcode = '22023';
  end if;
  if p_price is null or p_price < 1 or p_max_guests is null or p_max_guests < 1 then
    raise exception 'Price and guests must be at least 1' using errcode = '22023';
  end if;

  update public.listings
     set title           = trim(p_title),
         description     = nullif(trim(p_description), ''),
         city            = trim(p_city),
         country         = coalesce(nullif(trim(p_country), ''), 'India'),
         price_per_night = p_price,
         max_guests      = p_max_guests,
         image_url       = nullif(trim(p_image_url), '')
   where id = p_id and host_id = auth.uid()
  returning * into v_listing;

  if not found then
    raise exception 'Listing not found or not yours' using errcode = 'P0002';
  end if;
  return v_listing;
end;
$$;

create or replace function public.delete_listing(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'You must be logged in' using errcode = '28000';
  end if;

  if exists (
    select 1 from public.bookings b
    join public.listings l on l.id = b.listing_id
    where l.id = p_id and l.host_id = auth.uid()
      and b.status = 'confirmed' and b.check_out >= current_date
  ) then
    raise exception 'This listing has upcoming bookings and cannot be deleted'
      using errcode = 'P0001';
  end if;

  delete from public.listings where id = p_id and host_id = auth.uid();
  if not found then
    raise exception 'Listing not found or not yours' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.become_host() from public, anon;
revoke all on function public.create_listing(text, text, text, text, integer, integer, text) from public, anon;
revoke all on function public.update_listing(uuid, text, text, text, text, integer, integer, text) from public, anon;
revoke all on function public.delete_listing(uuid) from public, anon;
grant execute on function public.become_host() to authenticated;
grant execute on function public.create_listing(text, text, text, text, integer, integer, text) to authenticated;
grant execute on function public.update_listing(uuid, text, text, text, text, integer, integer, text) to authenticated;
grant execute on function public.delete_listing(uuid) to authenticated;
