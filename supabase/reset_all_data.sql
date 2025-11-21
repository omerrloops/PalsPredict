-- Reset all betting-related data (markets, bets, transactions)
-- WARNING: This will delete ALL markets, bets, and transactions!
-- User profiles and balances will be reset to 1000 credits

-- 1. Delete all bet transactions
delete from bet_transactions;

-- 2. Delete all bets
delete from bets;

-- 3. Delete all market outcomes
delete from market_outcomes;

-- 4. Delete all markets
delete from markets;

-- 5. Reset all user balances to 1000
update profiles set balance = 1000;

-- Verify everything is clean
select 'Markets' as table_name, count(*) as count from markets
union all
select 'Market Outcomes', count(*) from market_outcomes
union all
select 'Bets', count(*) from bets
union all
select 'Bet Transactions', count(*) from bet_transactions
union all
select 'Users with balance 1000', count(*) from profiles where balance = 1000;
