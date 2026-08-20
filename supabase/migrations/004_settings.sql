create table if not exists public.settings (
  key   text primary key,
  value text not null
);

-- default: leaderboard is hidden
insert into public.settings (key, value) values ('leaderboard_visible', 'false')
  on conflict (key) do nothing;

alter table public.settings enable row level security;

create policy "settings: read authenticated"
  on public.settings for select to authenticated
  using (true);

create policy "settings: write organizer"
  on public.settings for update to authenticated
  using (is_organizer())
  with check (is_organizer());
