-- Allow organizers to insert new settings rows (defensive: prevents silent no-op if seed row is absent)
create policy "settings: insert organizer"
  on public.settings for insert to authenticated
  with check (is_organizer());
