-- Helper: bypass RLS to check organizer role
create or replace function is_organizer()
returns boolean language sql security definer as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'organizer'
  )
$$;

-- profiles
alter table profiles enable row level security;

create policy "profiles: insert own" on profiles
  for insert with check (auth.uid() = id);

create policy "profiles: select own" on profiles
  for select using (auth.uid() = id or is_organizer());

-- exhibitors
alter table exhibitors enable row level security;

create policy "exhibitors: select authenticated" on exhibitors
  for select using (auth.role() = 'authenticated');

create policy "exhibitors: write organizer" on exhibitors
  for all using (is_organizer()) with check (is_organizer());

-- visits
alter table visits enable row level security;

create policy "visits: insert own" on visits
  for insert with check (auth.uid() = visitor_id);

create policy "visits: select own or organizer" on visits
  for select using (auth.uid() = visitor_id or is_organizer());

-- lucky_draw_winners
alter table lucky_draw_winners enable row level security;

create policy "winners: organizer only" on lucky_draw_winners
  for all using (is_organizer()) with check (is_organizer());
