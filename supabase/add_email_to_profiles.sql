-- Add email column to profiles table
-- Run this in your Supabase SQL Editor

-- Add email column
alter table profiles 
add column if not exists email text;

-- Backfill email for existing profiles from auth.users
update profiles p
set email = au.email
from auth.users au
where p.id = au.id and p.email is null;

-- Verify the update
select id, email, full_name, balance, is_admin
from profiles
order by updated_at desc nulls last;
