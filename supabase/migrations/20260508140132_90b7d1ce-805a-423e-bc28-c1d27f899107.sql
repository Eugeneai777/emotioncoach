create table public.pdf_generation_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null,
  record_id uuid not null,
  handbook_type text not null check (handbook_type in ('male_vitality','emotion_health')),
  filename text not null,
  status text not null default 'success' check (status in ('success','failed','partial')),
  error_message text,
  created_at timestamptz not null default now()
);

alter table public.pdf_generation_logs enable row level security;

create policy "Admin can read pdf logs"
  on public.pdf_generation_logs for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admin can insert pdf logs"
  on public.pdf_generation_logs for insert
  to authenticated
  with check (public.has_role(auth.uid(), 'admin') and admin_id = auth.uid());

create index idx_pdf_logs_record on public.pdf_generation_logs(record_id, created_at desc);