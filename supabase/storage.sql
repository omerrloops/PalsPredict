-- Create a storage bucket for market images
insert into storage.buckets (id, name, public)
values ('market-images', 'market-images', true);

-- Allow authenticated users to upload images
create policy "Authenticated users can upload market images"
on storage.objects for insert
with check (
  bucket_id = 'market-images' AND
  auth.role() = 'authenticated'
);

-- Allow everyone to view images
create policy "Anyone can view market images"
on storage.objects for select
using (bucket_id = 'market-images');

-- Allow users to delete their own uploads
create policy "Users can delete their own uploads"
on storage.objects for delete
using (
  bucket_id = 'market-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
