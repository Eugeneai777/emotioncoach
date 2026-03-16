-- Create audience_illustrations table
create table public.audience_illustrations (
  id uuid primary key default gen_random_uuid(),
  audience_id text unique not null,
  image_url text not null,
  created_at timestamptz default now()
);

alter table public.audience_illustrations enable row level security;

create policy "Anyone can read audience illustrations"
  on public.audience_illustrations for select using (true);

-- Create storage bucket
insert into storage.buckets (id, name, public)
values ('audience-illustrations', 'audience-illustrations', true);

-- Allow public read on the bucket
create policy "Public read audience illustrations"
  on storage.objects for select
  using (bucket_id = 'audience-illustrations');

-- Allow service role to upload
create policy "Service role upload audience illustrations"
  on storage.objects for insert
  with check (bucket_id = 'audience-illustrations');