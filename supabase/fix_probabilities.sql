-- Fix probability calculation to handle outcomes with 0 bets
-- They should show 0% instead of equal distribution

create or replace function update_outcome_probabilities(p_market_id uuid)
returns void as $$
declare
  total_volume numeric;
  outcome_record record;
  outcome_count integer;
begin
  -- Calculate total volume for this market from bet_transactions
  select coalesce(sum(amount), 0) into total_volume
  from bet_transactions
  where market_id = p_market_id and transaction_type = 'bet';

  -- Get number of outcomes
  select count(*) into outcome_count
  from market_outcomes
  where market_id = p_market_id;

  -- If no bets, set equal probabilities
  if total_volume = 0 then
    update market_outcomes
    set probability = round(100.0 / outcome_count)
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
    -- If outcome has volume, calculate percentage; otherwise set to 0
    if outcome_record.outcome_volume > 0 then
      update market_outcomes
      set probability = round((outcome_record.outcome_volume / total_volume) * 100)
      where id = outcome_record.id and market_id = outcome_record.market_id;
    else
      update market_outcomes
      set probability = 0
      where id = outcome_record.id and market_id = outcome_record.market_id;
    end if;
  end loop;
end;
$$ language plpgsql;

-- Rerun for all markets
do $$
declare
  market_record record;
begin
  for market_record in select distinct id from markets
  loop
    perform update_outcome_probabilities(market_record.id);
  end loop;
end $$;
