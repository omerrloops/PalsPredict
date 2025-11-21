-- Create bet_transactions table to track all betting activity over time
-- This enables historical analysis and volume charts

-- Create the transactions table
create table if not exists bet_transactions (
  id uuid default gen_random_uuid() primary key,
  market_id uuid references markets(id) on delete cascade not null,
  outcome_id text not null,
  user_id uuid references profiles(id) on delete cascade not null,
  amount numeric not null check (amount > 0),
  transaction_type text not null check (transaction_type in ('bet', 'win', 'refund')),
  created_at timestamp with time zone default now() not null
);

-- Add indexes for efficient querying
create index if not exists bet_transactions_market_id_idx on bet_transactions(market_id);
create index if not exists bet_transactions_outcome_id_idx on bet_transactions(outcome_id);
create index if not exists bet_transactions_user_id_idx on bet_transactions(user_id);
create index if not exists bet_transactions_created_at_idx on bet_transactions(created_at);
create index if not exists bet_transactions_market_outcome_idx on bet_transactions(market_id, outcome_id);

-- Enable RLS
alter table bet_transactions enable row level security;

-- RLS Policies
create policy "Transactions are viewable by everyone" on bet_transactions
  for select using (true);

create policy "Users can insert their own transactions" on bet_transactions
  for insert with check (auth.uid() = user_id);

-- Create a view for daily volume aggregation (useful for charts)
create or replace view outcome_volume as
select 
  market_id,
  outcome_id,
  date_trunc('day', created_at) as day,
  sum(amount) as total_volume,
  count(*) as transaction_count
from bet_transactions
where transaction_type = 'bet'
group by market_id, outcome_id, date_trunc('day', created_at)
order by day desc;

-- Grant access to the view
grant select on outcome_volume to authenticated;

-- Verify the setup
select 
  table_name, 
  column_name, 
  data_type 
from information_schema.columns 
where table_name = 'bet_transactions'
order by ordinal_position;
