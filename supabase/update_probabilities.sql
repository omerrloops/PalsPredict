-- Update market_outcomes probabilities after each bet
-- This ensures the home page and market cards show accurate probabilities

-- Create a function to recalculate and update outcome probabilities
create or replace function update_outcome_probabilities(p_market_id uuid)
returns void as $$
declare
  total_volume numeric;
  outcome_record record;
begin
  -- Calculate total volume for this market from bet_transactions
  select coalesce(sum(amount), 0) into total_volume
  from bet_transactions
  where market_id = p_market_id and transaction_type = 'bet';

  -- If no bets, set equal probabilities
  if total_volume = 0 then
    update market_outcomes
    set probability = round(100.0 / (select count(*) from market_outcomes where market_id = p_market_id))
    where market_id = p_market_id;
    return;
  end if;

  -- Update each outcome's probability based on its volume
  for outcome_record in 
    select 
      mo.id,
      mo.market_id,
      coalesce(sum(bt.amount), 0) as outcome_volume
    from market_outcomes mo
    left join bet_transactions bt on bt.outcome_id = mo.id and bt.market_id = mo.market_id and bt.transaction_type = 'bet'
    where mo.market_id = p_market_id
    group by mo.id, mo.market_id
  loop
    update market_outcomes
    set probability = round((outcome_record.outcome_volume / total_volume) * 100)
    where id = outcome_record.id and market_id = outcome_record.market_id;
  end loop;
end;
$$ language plpgsql;

-- Create a trigger to automatically update probabilities after a bet transaction
create or replace function trigger_update_probabilities()
returns trigger as $$
begin
  -- Update probabilities for the market
  perform update_outcome_probabilities(NEW.market_id);
  return NEW;
end;
$$ language plpgsql;

-- Drop existing trigger if it exists
drop trigger if exists update_probabilities_after_bet on bet_transactions;

-- Create the trigger
create trigger update_probabilities_after_bet
  after insert on bet_transactions
  for each row
  when (NEW.transaction_type = 'bet')
  execute function trigger_update_probabilities();

-- Update probabilities for all existing markets based on current bets
do $$
declare
  market_record record;
begin
  for market_record in select distinct id from markets
  loop
    perform update_outcome_probabilities(market_record.id);
  end loop;
end $$;

-- Verify the update
select 
  m.question,
  mo.name,
  mo.probability,
  coalesce(sum(bt.amount), 0) as total_bet
from markets m
join market_outcomes mo on mo.market_id = m.id
left join bet_transactions bt on bt.outcome_id = mo.id and bt.transaction_type = 'bet'
group by m.id, m.question, mo.id, mo.name, mo.probability
order by m.question, mo.name;
