create table public.ai_request_limits (
  user_id uuid not null references auth.users (id) on delete cascade,
  generation_kind text not null check (
    generation_kind in ('weather_advice', 'travel_itinerary')
  ),
  window_started_at timestamptz not null,
  request_count integer not null check (request_count between 1 and 20),
  primary key (user_id, generation_kind)
);

alter table public.ai_request_limits enable row level security;

revoke all on public.ai_request_limits from public, anon, authenticated;

create or replace function public.consume_ai_request_quota(
  p_generation_kind text
)
returns table (
  allowed boolean,
  request_count integer,
  request_limit integer,
  remaining integer,
  reset_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_window interval := interval '1 hour';
  v_limit integer;
  v_count integer;
  v_window_started_at timestamptz;
begin
  if v_user_id is null then
    raise exception using
      errcode = '42501',
      message = 'Authentication is required.';
  end if;

  v_limit := case p_generation_kind
    when 'weather_advice' then 20
    when 'travel_itinerary' then 6
    else null
  end;

  if v_limit is null then
    raise exception using
      errcode = '22023',
      message = 'Unsupported AI generation kind.';
  end if;

  insert into public.ai_request_limits as current_limit (
    user_id,
    generation_kind,
    window_started_at,
    request_count
  )
  values (
    v_user_id,
    p_generation_kind,
    v_now,
    1
  )
  on conflict (user_id, generation_kind) do update
  set
    window_started_at = case
      when current_limit.window_started_at <= v_now - v_window then v_now
      else current_limit.window_started_at
    end,
    request_count = case
      when current_limit.window_started_at <= v_now - v_window then 1
      else current_limit.request_count + 1
    end
  where
    current_limit.window_started_at <= v_now - v_window
    or current_limit.request_count < v_limit
  returning
    current_limit.request_count,
    current_limit.window_started_at
  into v_count, v_window_started_at;

  if found then
    return query select
      true,
      v_count,
      v_limit,
      case when v_limit > v_count then v_limit - v_count else 0 end,
      v_window_started_at + v_window;
    return;
  end if;

  select
    current_limit.request_count,
    current_limit.window_started_at
  into v_count, v_window_started_at
  from public.ai_request_limits as current_limit
  where current_limit.user_id = v_user_id
    and current_limit.generation_kind = p_generation_kind;

  if not found then
    raise exception using
      errcode = '55000',
      message = 'AI request quota state is unavailable.';
  end if;

  return query select
    false,
    v_count,
    v_limit,
    0,
    v_window_started_at + v_window;
end;
$$;

revoke all on function public.consume_ai_request_quota(text)
from public, anon;

grant execute on function public.consume_ai_request_quota(text)
to authenticated;
