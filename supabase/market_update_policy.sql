-- Allow authenticated users to update market volume (for bet placement)
create policy "Authenticated users can update market volume" on markets
  for update using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
