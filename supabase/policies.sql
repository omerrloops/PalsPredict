-- Allow authenticated users to create markets
create policy "Authenticated users can create markets" on markets
  for insert with check (auth.role() = 'authenticated');

-- Allow authenticated users to create outcomes
create policy "Authenticated users can create outcomes" on market_outcomes
  for insert with check (auth.role() = 'authenticated');
