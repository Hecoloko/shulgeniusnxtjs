-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Members
create table if not exists public.members (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text,
  phone text,
  gender text,
  location text,
  address text,
  city text,
  state text,
  zip text,
  date_of_birth text,
  spouse text,
  jewish_info text,
  tags text[],
  balance numeric default 0,
  role text,
  status text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Campaigns
create table if not exists public.campaigns (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  type text,
  goal numeric,
  raised numeric default 0,
  start_date text,
  end_date text,
  status text,
  processors text[],
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Invoices
create table if not exists public.invoices (
  id uuid primary key default uuid_generate_v4(),
  invoice_number text not null,
  member_id uuid references public.members(id),
  member_name text,
  member_email text,
  total numeric not null,
  balance numeric not null,
  paid boolean default false,
  status text,
  due_date text,
  items jsonb, -- Storing items array as JSONB
  payment_link text,
  campaign_id uuid references public.campaigns(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Settings
create table if not exists public.settings (
  id uuid primary key default uuid_generate_v4(),
  key text not null unique,
  value text,
  category text,
  updated_at timestamptz default now()
);

-- Admin Users (External Profile table)
create table if not exists public.admin_users (
  id uuid primary key default uuid_generate_v4(),
  supabase_user_id uuid references auth.users(id),
  email text not null,
  name text,
  role text,
  linked_member_id uuid references public.members(id),
  status text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Kibbudim (Aliyahs)
create table if not exists public.kibbudim (
  id uuid primary key default uuid_generate_v4(),
  member_id uuid references public.members(id),
  member_name text,
  kibbud_type text,
  parsha_chodesh text,
  year integer,
  date text,
  amount numeric,
  notes text,
  invoice_id uuid references public.invoices(id),
  created_at timestamptz default now()
);

-- Payment Processors
create table if not exists public.payment_processors (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  type text,
  public_key text,
  secret_key text,
  is_active boolean default true,
  is_default boolean default false,
  config jsonb,
  created_at timestamptz default now()
);

-- Billable Items
create table if not exists public.items (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  price numeric,
  type text,
  is_active boolean default true,
  created_at timestamptz default now()
);
