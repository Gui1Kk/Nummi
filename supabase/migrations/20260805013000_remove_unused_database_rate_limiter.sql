begin;

drop function if exists public.consume_api_rate_limit_admin(uuid,text,integer,integer);
drop function if exists public.consume_api_rate_limit_v2(uuid,text,integer,integer);
drop table if exists public.api_rate_limits_internal;
drop table if exists private.api_rate_limits;

commit;
