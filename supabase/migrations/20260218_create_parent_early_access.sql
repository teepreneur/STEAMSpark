create table public.parent_early_access (
    id uuid not null default gen_random_uuid(),
    name text not null,
    email text not null,
    phone text not null,
    child_age text,
    interests text,
    needs_setup_help boolean default false,
    created_at timestamp with time zone not null default now(),
    constraint parent_early_access_pkey primary key (id)
);

-- Enable RLS
alter table public.parent_early_access enable row level security;

-- Policies
-- 1. Anonymous users can insert (submit form)
create policy "Enable insert for everyone" on public.parent_early_access
    for insert with check (true);

-- 2. Service role (admin) can select (view leads)
create policy "Enable read access for service role only" on public.parent_early_access
    for select using (auth.role() = 'service_role');
