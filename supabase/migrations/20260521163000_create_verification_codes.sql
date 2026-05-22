create extension if not exists pgcrypto;

create table if not exists public.verification_codes (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  code text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists verification_codes_email_code_created_at_idx
  on public.verification_codes (email, code, created_at desc);

create index if not exists verification_codes_expires_at_idx
  on public.verification_codes (expires_at);

alter table public.verification_codes enable row level security;
