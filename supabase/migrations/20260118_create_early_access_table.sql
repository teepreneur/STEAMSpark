create table public.early_access_signups (
    id uuid not null default gen_random_uuid(),
    name text not null,
    email text not null,
    phone text not null,
    subject text not null,
    experience text not null,
    reason text,
    created_at timestamp with time zone not null default now(),
    constraint early_access_signups_pkey primary key (id)
);

-- Enable RLS
alter table public.early_access_signups enable row level security;

-- Policies
-- 1. Anonymous users can insert (submit form)
create policy "Enable insert for everyone" on public.early_access_signups
    for insert with check (true);

-- 2. Service role (admin) can select (view leads)
create policy "Enable read access for service role only" on public.early_access_signups
    for select using (auth.role() = 'service_role');
