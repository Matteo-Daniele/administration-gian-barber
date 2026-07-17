-- =============================================
-- Gian Barber - Supabase Schema
-- Run this in the Supabase SQL Editor
-- =============================================

-- 1. Profiles table (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'barber' check (role in ('admin', 'barber')),
  barber_share_pct numeric(5,2) not null default 50.00,
  shop_share_pct numeric(5,2) not null default 50.00,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 2. Cuts table
create table public.cuts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  cut_type text not null check (cut_type in ('simple', 'hair_beard', 'color_change')),
  price numeric(10,2) not null,
  client_name text not null default '',
  notes text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  payment_type text check (payment_type in ('cash', 'transfer')),
  approved_by uuid references public.profiles(id),
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

-- 3. Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4. Row Level Security

alter table public.profiles enable row level security;
alter table public.cuts enable row level security;

-- Profiles: users can read all profiles, update only their own
create policy "Profiles: users can view all"
  on public.profiles for select
  using (true);

create policy "Profiles: users can update own"
  on public.profiles for update
  using (auth.uid() = id);

-- Profiles: admin can update any profile
create policy "Profiles: admin can update any"
  on public.profiles for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Profiles: admin can insert new users
create policy "Profiles: admin can insert"
  on public.profiles for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Profiles: admin can delete users
create policy "Profiles: admin can delete"
  on public.profiles for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Cuts: barbers can insert their own cuts
create policy "Cuts: barbers can insert own"
  on public.cuts for insert
  with check (auth.uid() = user_id);

-- Cuts: barbers can view all cuts
create policy "Cuts: barbers can view all"
  on public.cuts for select
  using (true);

-- Cuts: barbers can delete own pending cuts
create policy "Cuts: barbers can delete own pending"
  on public.cuts for delete
  using (auth.uid() = user_id and status = 'pending');

-- Cuts: admin can update any cut (approve/reject)
create policy "Cuts: admin can update any"
  on public.cuts for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Cuts: admin can delete any cut
create policy "Cuts: admin can delete any"
  on public.cuts for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- 5. Indexes for performance
create index idx_cuts_user_id on public.cuts(user_id);
create index idx_cuts_created_at on public.cuts(created_at);
create index idx_cuts_cut_type on public.cuts(cut_type);
create index idx_cuts_status on public.cuts(status);

-- =============================================
-- IMPORTANT: After running this, manually set
-- the first user as admin:
--
-- UPDATE public.profiles
-- SET role = 'admin'
-- WHERE email = 'YOUR_EMAIL@example.com';
-- =============================================
