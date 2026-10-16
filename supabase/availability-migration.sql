-- =====================================================================
-- AVAILABILITY MIGRATION (run in Supabase -> SQL Editor -> New query -> Run)
-- Run AFTER schema.sql. Safe to run more than once.
-- Adds two read-only functions so anyone can see WHEN a stay is taken,
-- without ever seeing WHO booked it (bookings stay private via RLS).
-- =====================================================================

-- Upcoming booked date ranges for one listing (dates only, no user info).
create or replace function public.get_booked_ranges(p_listing_id uuid)
returns table (check_in date, check_out date)
language sql
stable
security definer
set search_path = ''
as $$
  select b.check_in, b.check_out
    from public.bookings b
   where b.listing_id = p_listing_id
     and b.status = 'confirmed'
     and b.check_out >= current_date
   order by b.check_in;
$$;

-- Ids of listings that have a confirmed booking overlapping the given dates.
-- [check_in, check_out) means a guest may check in on another guest's check-out day.
create or replace function public.unavailable_listing_ids(
  p_check_in  date,
  p_check_out date
)
returns setof uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if p_check_in is null or p_check_out is null or p_check_out <= p_check_in then
    return;
  end if;

  return query
    select distinct b.listing_id
      from public.bookings b
     where b.status = 'confirmed'
       and daterange(b.check_in, b.check_out, '[)')
           && daterange(p_check_in, p_check_out, '[)');
end;
$$;

revoke all on function public.get_booked_ranges(uuid) from public;
revoke all on function public.unavailable_listing_ids(date, date) from public;
grant execute on function public.get_booked_ranges(uuid) to anon, authenticated;
grant execute on function public.unavailable_listing_ids(date, date) to anon, authenticated;
