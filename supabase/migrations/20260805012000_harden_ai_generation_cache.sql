alter table public.ai_generation_cache enable row level security;

drop policy if exists "Users can read their AI cache"
on public.ai_generation_cache;

drop policy if exists "Users can create their AI cache"
on public.ai_generation_cache;

drop policy if exists "Users can update their AI cache"
on public.ai_generation_cache;

drop policy if exists "Users can delete their AI cache"
on public.ai_generation_cache;

revoke all on public.ai_generation_cache
from public, anon, authenticated;

grant select, insert, update, delete on public.ai_generation_cache
to service_role;

-- Older deployments allowed authenticated users to write this cache. Purge
-- those regenerable rows so previously injected values cannot become hits.
truncate table public.ai_generation_cache;
