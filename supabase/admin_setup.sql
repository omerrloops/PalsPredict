-- Add is_admin column to profiles table
alter table profiles add column is_admin boolean default false;

-- Make yourself an admin (replace with your actual email)
-- You'll need to run this after you've signed in at least once
-- UPDATE: Replace 'your-email@gmail.com' with your actual Google email
update profiles
set is_admin = true
where id = (
  select id from auth.users 
  where email = 'your-email@gmail.com'
);

-- Allow admins to update any user's balance
create policy "Admins can update any balance" on profiles
  for update using (
    exists (
      select 1 from profiles
      where id = auth.uid() and is_admin = true
    )
  );
