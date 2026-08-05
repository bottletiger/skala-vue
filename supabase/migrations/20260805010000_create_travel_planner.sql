create extension if not exists pgcrypto;

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  destination_id text not null check (char_length(destination_id) between 1 and 160),
  destination_name text not null check (char_length(destination_name) between 1 and 120),
  country_name text check (country_name is null or char_length(country_name) <= 120),
  country_code text check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  timezone text check (timezone is null or char_length(timezone) <= 80),
  start_date date not null,
  end_date date not null,
  preferences jsonb not null default '{}'::jsonb,
  weather_snapshot jsonb not null default '{}'::jsonb,
  air_quality_snapshot jsonb not null default '{}'::jsonb,
  attraction_candidates jsonb not null default '[]'::jsonb,
  ai_itinerary jsonb,
  ai_itinerary_generated_at timestamptz,
  ai_weather_advice jsonb,
  ai_weather_advice_generated_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint trips_valid_date_range check (
    end_date >= start_date and end_date < start_date + 14
  ),
  constraint trips_preferences_object check (jsonb_typeof(preferences) = 'object'),
  constraint trips_weather_snapshot_object check (jsonb_typeof(weather_snapshot) = 'object'),
  constraint trips_air_quality_snapshot_object check (jsonb_typeof(air_quality_snapshot) = 'object'),
  constraint trips_attraction_candidates_array check (jsonb_typeof(attraction_candidates) = 'array'),
  constraint trips_ai_itinerary_object check (ai_itinerary is null or jsonb_typeof(ai_itinerary) = 'object'),
  constraint trips_ai_weather_advice_object check (ai_weather_advice is null or jsonb_typeof(ai_weather_advice) = 'object')
);

create table public.ai_generation_cache (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  generation_kind text not null check (generation_kind in ('weather_advice', 'travel_itinerary')),
  input_hash text not null check (input_hash ~ '^[0-9a-f]{64}$'),
  result jsonb not null check (jsonb_typeof(result) = 'object'),
  sources jsonb not null default '[]'::jsonb check (jsonb_typeof(sources) = 'array'),
  expires_at timestamptz not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, generation_kind, input_hash)
);

create index trips_user_id_created_at_idx
  on public.trips (user_id, created_at desc);

create index ai_generation_cache_lookup_idx
  on public.ai_generation_cache (user_id, generation_kind, input_hash, expires_at desc);

create or replace function public.set_travel_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;

create trigger set_trips_updated_at
before update on public.trips
for each row execute function public.set_travel_updated_at();

create trigger set_ai_generation_cache_updated_at
before update on public.ai_generation_cache
for each row execute function public.set_travel_updated_at();

alter table public.trips enable row level security;
alter table public.ai_generation_cache enable row level security;

create policy "Users can read their trips"
on public.trips for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their trips"
on public.trips for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their trips"
on public.trips for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their trips"
on public.trips for delete
to authenticated
using ((select auth.uid()) = user_id);

revoke all on public.trips from anon;
revoke all on public.ai_generation_cache from public, anon, authenticated;
grant select, insert, update, delete on public.trips to authenticated;
grant select, insert, update, delete on public.ai_generation_cache to service_role;
