-- Supabase storage setup for complaint photo uploads.
-- Safe to run multiple times.

begin;

-- Ensure the bucket exists and stays public for photo viewing.
insert into storage.buckets (id, name, public)
values ('complaint-photos', 'complaint-photos', true)
on conflict (id) do update
set
  name = excluded.name,
  public = excluded.public;

alter table storage.objects enable row level security;

drop policy if exists "Public can view complaint photos" on storage.objects;

create policy "Public can view complaint photos"
on storage.objects
for select
to public
using (bucket_id = 'complaint-photos');

commit;
