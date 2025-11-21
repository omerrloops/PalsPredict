-- Create a table for public profiles
create table profiles (
  id uuid references auth.users not null primary key,
  updated_at timestamp with time zone,
  username text unique,
  full_name text,
  avatar_url text,
  website text,
  balance numeric default 1000,

  constraint username_length check (char_length(username) >= 3)
);

-- Set up Row Level Security (RLS)
-- See https://supabase.com/docs/guides/auth/row-level-security for more details.
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- This triggers a profile creation when a user signs up
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url, balance)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', 1000);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- MARKETS TABLE
create table markets (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  question text not null,
  image_url text,
  description text,
  category text not null,
  end_date timestamp with time zone not null,
  status text default 'active' check (status in ('active', 'closed', 'resolved')),
  volume numeric default 0,
  winning_outcome_name text,
  resolved_at timestamp with time zone,
);

alter table markets enable row level security;

create policy "Markets are viewable by everyone" on markets
  for select using (true);

-- MARKET OUTCOMES TABLE
create table market_outcomes (
  id text not null, -- e.g., 'yes', 'no', or uuid
  market_id uuid references markets(id) not null,
  name text not null,
  probability numeric default 50,
  color text,
  
  primary key (market_id, id)
);

alter table market_outcomes enable row level security;

create policy "Outcomes are viewable by everyone" on market_outcomes
  for select using (true);

-- BETS TABLE
create table bets (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references profiles(id) not null,
  market_id uuid references markets(id) not null,
  outcome_id text not null,
  amount numeric not null,
  
  -- Foreign key constraint for outcome needs to be composite or just trust the app logic + market_id check
  -- For simplicity in this schema, we just link to market and store outcome_id string
  constraint fk_market foreign key (market_id) references markets(id)
);

alter table bets enable row level security;

create policy "Bets are viewable by everyone" on bets
  for select using (true);

create policy "Users can place their own bets" on bets
  for insert with check (auth.uid() = user_id);

-- Insert some mock data for Markets (Optional, but helpful)
insert into markets (question, category, end_date, image_url, volume) values
('Will Bitcoin hit $100k by the end of 2024?', 'Crypto', '2024-12-31', 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800&auto=format&fit=crop&q=60', 1250000),
('Who will win the 2024 US Presidential Election?', 'Politics', '2024-11-05', 'https://images.unsplash.com/photo-1540910419868-474947ce871f?w=800&auto=format&fit=crop&q=60', 45000000),
('Will GTA VI be released before 2026?', 'Gaming', '2025-12-31', 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&auto=format&fit=crop&q=60', 500000);

-- Insert outcomes for the mock markets
-- Note: You'll need the actual UUIDs generated above to insert these correctly if running manually. 
-- For a robust script, we'd use DO blocks or variables, but for Supabase SQL editor, simple is often better.
-- I will leave the mock data insertion for the user to handle or do it dynamically later.
