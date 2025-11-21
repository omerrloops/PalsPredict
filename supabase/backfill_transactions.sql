-- Backfill bet_transactions from existing bets table
-- This ensures historical bets are included in probability calculations

-- Insert all existing bets into bet_transactions if they don't exist already
insert into bet_transactions (market_id, outcome_id, user_id, amount, transaction_type, created_at)
select 
  b.market_id,
  b.outcome_id,
  b.user_id,
  b.amount,
  'bet' as transaction_type,
  b.created_at
from bets b
where not exists (
  select 1 
  from bet_transactions bt 
  where bt.market_id = b.market_id 
    and bt.outcome_id = b.outcome_id 
    and bt.user_id = b.user_id 
    and bt.amount = b.amount
    and bt.created_at = b.created_at
);

-- Update probabilities for all markets
do $$
declare
  market_record record;
begin
  for market_record in select distinct id from markets
  loop
    perform update_outcome_probabilities(market_record.id);
  end loop;
end $$;

-- Verify the results
select 
  m.question,
  mo.name,
  mo.probability,
  coalesce(sum(bt.amount), 0) as total_bets_from_transactions
from markets m
join market_outcomes mo on mo.market_id = m.id
left join bet_transactions bt on bt.outcome_id = mo.id and bt.transaction_type = 'bet'
group by m.id, m.question, mo.id, mo.name, mo.probability
order by m.question, mo.name;
