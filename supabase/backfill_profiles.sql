-- Manually create profiles for existing users who don't have one yet
-- Run this in your Supabase SQL Editor AFTER running profile_trigger.sql

-- Insert profiles for any auth.users that don't have a profile yet
insert into public.profiles (id, email, full_name, avatar_url, balance, is_admin)
select 
  au.id,
  au.email,
  au.raw_user_meta_data->>'full_name' as full_name,
  au.raw_user_meta_data->>'avatar_url' as avatar_url,
  1000 as balance,
  false as is_admin
from auth.users au
left join public.profiles p on au.id = p.id
where p.id is null;

-- Verify all users now have profiles
select 
  au.email,
  p.id,
  p.full_name,
  p.balance,
  p.is_admin
from auth.users au
left join public.profiles p on au.id = p.id
order by au.created_at desc;
