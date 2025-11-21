-- Debug: Check if transactions are being recorded and trigger is working

-- 1. Check bet_transactions table
select 
  bt.id,
  bt.market_id,
  bt.outcome_id,
  mo.name as outcome_name,
  bt.amount,
  bt.transaction_type,
  bt.created_at
from bet_transactions bt
join market_outcomes mo on mo.id = bt.outcome_id
order by bt.created_at desc
limit 20;

-- 2. Check current probabilities in market_outcomes
select 
  m.question,
  mo.name,
  mo.probability,
  mo.id as outcome_id
from markets m
join market_outcomes mo on mo.market_id = m.id
order by m.question, mo.name;

-- 3. Check if trigger exists
select 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
from information_schema.triggers
where trigger_name = 'update_probabilities_after_bet';

-- 4. Manually run the update function for all markets to sync
do $$
declare
  market_record record;
begin
  for market_record in select distinct id from markets
  loop
    perform update_outcome_probabilities(market_record.id);
  end loop;
end $$;

-- 5. Verify the probabilities were updated
select 
  m.question,
  mo.name,
  mo.probability,
  coalesce(sum(bt.amount), 0) as total_bets
from markets m
join market_outcomes mo on mo.market_id = m.id
left join bet_transactions bt on bt.outcome_id = mo.id and bt.transaction_type = 'bet'
group by m.id, m.question, mo.id, mo.name, mo.probability
order by m.question, mo.name;
