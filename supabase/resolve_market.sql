-- Market Resolution Function
-- Allows admins to resolve a market and distribute winnings to winners

create or replace function resolve_market(
  p_market_id uuid,
  p_winning_outcome_name text,
  p_admin_user_id uuid
)
returns jsonb as $$
declare
  v_is_admin boolean;
  v_market_volume numeric;
  v_winning_pool numeric;
  v_total_payout numeric := 0;
  v_winner_record record;
  v_payout numeric;
  v_winners_count integer := 0;
begin
  -- 1. Verify user is admin
  select is_admin into v_is_admin
  from profiles
  where id = p_admin_user_id;
  
  if not v_is_admin then
    raise exception 'Only admins can resolve markets';
  end if;

  -- 2. Verify market exists and is active
  select volume into v_market_volume
  from markets
  where id = p_market_id and status = 'active';
  
  if not found then
    raise exception 'Market not found or already resolved';
  end if;

  -- 3. Calculate total amount bet on winning outcome
  select coalesce(sum(amount), 0) into v_winning_pool
  from bets
  where market_id = p_market_id and outcome_id = p_winning_outcome_name;

  -- If no one bet on the winning outcome, no payouts needed
  if v_winning_pool = 0 then
    -- Update market status
    update markets
    set status = 'resolved',
        winning_outcome_id = p_winning_outcome_name,
        resolved_at = now()
    where id = p_market_id;
    
    return jsonb_build_object(
      'success', true,
      'winners_count', 0,
      'total_payout', 0,
      'message', 'Market resolved but no winners (no bets on winning outcome)'
    );
  end if;

  -- 4. Distribute winnings proportionally to winners
  for v_winner_record in
    select 
      user_id,
      sum(amount) as total_bet
    from bets
    where market_id = p_market_id 
      and outcome_id = p_winning_outcome_name
    group by user_id
  loop
    -- Calculate proportional payout: (user's bet / total winning pool) * total market volume
    v_payout := round((v_winner_record.total_bet / v_winning_pool) * v_market_volume);
    
    -- Update user balance
    update profiles
    set balance = balance + v_payout
    where id = v_winner_record.user_id;
    
    -- Record winning transaction
    insert into bet_transactions (
      market_id,
      outcome_id,
      user_id,
      amount,
      transaction_type
    ) values (
      p_market_id,
      p_winning_outcome_name,
      v_winner_record.user_id,
      v_payout,
      'win'
    );
    
    v_total_payout := v_total_payout + v_payout;
    v_winners_count := v_winners_count + 1;
  end loop;

  -- 5. Update market status
  update markets
  set status = 'resolved',
      winning_outcome_id = p_winning_outcome_name,
      resolved_at = now()
  where id = p_market_id;

  -- 6. Return summary
  return jsonb_build_object(
    'success', true,
    'winners_count', v_winners_count,
    'total_payout', v_total_payout,
    'winning_pool', v_winning_pool,
    'market_volume', v_market_volume
  );
end;
$$ language plpgsql security definer;

-- Grant execute permission to authenticated users (function checks admin status internally)
grant execute on function resolve_market(uuid, text, uuid) to authenticated;
