-- Ensure the trigger function exists for auto-creating profiles
-- Run this in your Supabase SQL Editor

-- Drop existing trigger and function if they exist (to recreate)
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- Create the function that will be triggered
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, balance, is_admin)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url', 
    1000,
    false
  );
  return new;
end;
$$ language plpgsql security definer;

-- Create the trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Verify it worked
select 
  trigger_name, 
  event_manipulation, 
  event_object_table
from information_schema.triggers
where trigger_name = 'on_auth_user_created';
