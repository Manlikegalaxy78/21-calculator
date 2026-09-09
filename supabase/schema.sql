-- Run this once in the Supabase SQL Editor (Project -> SQL Editor -> New query).

create table if not exists public.entitlements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'none',              -- 'none' | 'monthly' | 'lifetime'
  status text not null default 'inactive',        -- 'inactive' | 'active' | 'canceled'
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.entitlements enable row level security;

-- a signed-in user can read only their own entitlement row
create policy "read own entitlement"
  on public.entitlements for select
  using (auth.uid() = user_id);

-- entitlements are written only by the server (via the service role key in the
-- Stripe webhook), never directly by the client — so no insert/update policy
-- is granted to normal users. This is intentional: it stops someone editing
-- their own row in the browser to grant themselves a paid plan for free.

-- convenience view the app queries to check "is this user unlocked right now"
create or replace view public.my_entitlement as
  select plan, status, current_period_end
  from public.entitlements
  where user_id = auth.uid();
