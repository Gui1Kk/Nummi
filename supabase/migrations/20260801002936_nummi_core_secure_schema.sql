-- Baseline consolidado do estado seguro anterior à versão 1.3.
-- Reconstruído do catálogo PostgreSQL de produção em 2026-08-05.
begin;
create extension if not exists pgcrypto with schema extensions;
create schema if not exists private;

do $$begin
 if not exists(select 1 from pg_type where typnamespace='public'::regnamespace and typname='transaction_kind')then create type public.transaction_kind as enum('income','expense');end if;
 if not exists(select 1 from pg_type where typnamespace='public'::regnamespace and typname='transaction_status')then create type public.transaction_status as enum('planned','posted');end if;
 if not exists(select 1 from pg_type where typnamespace='public'::regnamespace and typname='transaction_source')then create type public.transaction_source as enum('manual','recurrence','subscription','import','api');end if;
 if not exists(select 1 from pg_type where typnamespace='public'::regnamespace and typname='category_scope')then create type public.category_scope as enum('income','expense','both');end if;
 if not exists(select 1 from pg_type where typnamespace='public'::regnamespace and typname='recurrence_frequency')then create type public.recurrence_frequency as enum('daily','weekly','monthly','yearly');end if;
 if not exists(select 1 from pg_type where typnamespace='public'::regnamespace and typname='subscription_cycle')then create type public.subscription_cycle as enum('monthly','yearly');end if;
end$$;

create table if not exists public.profiles(
 user_id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null default '' check(char_length(display_name)<=80),
 currency text not null default 'BRL' check(currency~'^[A-Z]{3}$'),
 locale text not null default 'pt-BR' check(char_length(locale)between 2 and 20),
 timezone text not null default 'America/Porto_Velho' check(char_length(timezone)between 1 and 64),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table if not exists public.user_settings(
 user_id uuid primary key references auth.users(id) on delete cascade,
 theme text not null default 'dark' check(theme in('system','light','dark')),
 privacy_mode boolean not null default false,compact_mode boolean not null default false,
 week_starts_on smallint not null default 1 check(week_starts_on between 0 and 6),
 reminder_days smallint not null default 3 check(reminder_days between 0 and 60),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table if not exists public.categories(
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id)on delete cascade,
 name text not null check(char_length(trim(name))between 1 and 60),scope public.category_scope not null default 'both',
 color text not null default '#64748b' check(color~'^#[0-9A-Fa-f]{6}$'),archived boolean not null default false,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(user_id,id)
);
create unique index if not exists categories_user_name_uidx on public.categories(user_id,lower(trim(name)));
create index if not exists categories_user_active_idx on public.categories(user_id,archived,name);

create table if not exists public.recurring_rules(
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id)on delete cascade,
 description text not null check(char_length(trim(description))between 1 and 160),amount numeric not null check(amount>0 and amount<=999999999999.99),
 kind public.transaction_kind not null,category_id uuid,frequency public.recurrence_frequency not null,
 interval_count smallint not null default 1 check(interval_count between 1 and 365),anchor_day smallint not null check(anchor_day between 1 and 31),
 start_date date not null,next_date date not null check(next_date>=start_date),end_date date check(end_date is null or end_date>=start_date),
 auto_post boolean not null default true,active boolean not null default true,note text check(note is null or char_length(note)<=2000),last_posted_at timestamptz,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(user_id,id),
 constraint recurring_rules_user_category_fkey foreign key(user_id,category_id)references public.categories(user_id,id)on delete set null(category_id)
);
create index if not exists recurring_rules_due_idx on public.recurring_rules(user_id,active,auto_post,next_date);
create index if not exists recurring_rules_user_active_due_idx on public.recurring_rules(user_id,active,next_date)where active;
create index if not exists recurring_rules_user_category_idx on public.recurring_rules(user_id,category_id);
create index if not exists recurring_rules_category_idx on public.recurring_rules(category_id);

create table if not exists public.subscriptions(
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id)on delete cascade,
 name text not null check(char_length(trim(name))between 1 and 120),amount numeric not null check(amount>0 and amount<=999999999999.99),category_id uuid,
 cycle public.subscription_cycle not null default 'monthly',interval_count smallint not null default 1 check(interval_count between 1 and 120),billing_day smallint not null check(billing_day between 1 and 31),
 start_date date not null,next_charge date not null check(next_charge>=start_date),end_date date check(end_date is null or end_date>=start_date),active boolean not null default true,auto_post boolean not null default true,
 reminder_days smallint not null default 3 check(reminder_days between 0 and 60),website text check(website is null or char_length(website)<=500),note text check(note is null or char_length(note)<=2000),last_posted_at timestamptz,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(user_id,id),
 constraint subscriptions_user_category_fkey foreign key(user_id,category_id)references public.categories(user_id,id)on delete set null(category_id)
);
create index if not exists subscriptions_due_idx on public.subscriptions(user_id,active,auto_post,next_charge);
create index if not exists subscriptions_user_active_due_idx on public.subscriptions(user_id,active,next_charge)where active;
create index if not exists subscriptions_user_category_idx on public.subscriptions(user_id,category_id);
create index if not exists subscriptions_category_idx on public.subscriptions(category_id);

create table if not exists public.transactions(
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id)on delete cascade,
 description text not null check(char_length(trim(description))between 1 and 160),amount numeric not null check(amount>0 and amount<=999999999999.99),kind public.transaction_kind not null,
 status public.transaction_status not null default 'posted',source public.transaction_source not null default 'manual',category_id uuid,transaction_date date not null,competence_month date,
 note text check(note is null or char_length(note)<=2000),recurrence_id uuid,subscription_id uuid,occurrence_date date,idempotency_key text check(idempotency_key is null or char_length(idempotency_key)between 8 and 128),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(user_id,idempotency_key),
 check(num_nonnulls(recurrence_id,subscription_id)<=1),check((recurrence_id is null and subscription_id is null)or occurrence_date is not null),
 constraint transactions_user_category_fkey foreign key(user_id,category_id)references public.categories(user_id,id)on delete set null(category_id),
 constraint transactions_user_recurrence_fkey foreign key(user_id,recurrence_id)references public.recurring_rules(user_id,id)on delete set null(recurrence_id),
 constraint transactions_user_subscription_fkey foreign key(user_id,subscription_id)references public.subscriptions(user_id,id)on delete set null(subscription_id)
);
create index if not exists transactions_user_date_idx on public.transactions(user_id,transaction_date desc,created_at desc);
create index if not exists transactions_user_month_idx on public.transactions(user_id,competence_month,kind,status);
create index if not exists transactions_user_category_idx on public.transactions(user_id,category_id,transaction_date desc);
create index if not exists transactions_user_status_date_idx on public.transactions(user_id,status,transaction_date desc);
create index if not exists transactions_category_fk_idx on public.transactions(category_id);
create index if not exists transactions_recurrence_fk_idx on public.transactions(recurrence_id)where recurrence_id is not null;
create index if not exists transactions_subscription_fk_idx on public.transactions(subscription_id)where subscription_id is not null;
create unique index if not exists transactions_recurrence_occurrence_uidx on public.transactions(user_id,recurrence_id,occurrence_date)where recurrence_id is not null;
create unique index if not exists transactions_subscription_occurrence_uidx on public.transactions(user_id,subscription_id,occurrence_date)where subscription_id is not null;

create table if not exists public.budgets(
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id)on delete cascade,category_id uuid not null,
 month date not null check(extract(day from month)=1),amount numeric not null check(amount>0 and amount<=999999999999.99),rollover boolean not null default false,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(user_id,category_id,month),
 constraint budgets_user_category_fkey foreign key(user_id,category_id)references public.categories(user_id,id)on delete cascade
);
create index if not exists budgets_user_month_idx on public.budgets(user_id,month);create index if not exists budgets_category_idx on public.budgets(category_id);
create table if not exists public.notifications(
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id)on delete cascade,kind text not null check(kind in('info','warning','success','error','subscription_due','recurrence_due','budget_alert')),
 title text not null check(char_length(trim(title))between 1 and 120),message text not null check(char_length(trim(message))between 1 and 500),due_at timestamptz,read_at timestamptz,
 entity_type text check(entity_type is null or entity_type in('transaction','recurrence','subscription','budget')),entity_id uuid,created_at timestamptz not null default now()
);
create index if not exists notifications_user_unread_idx on public.notifications(user_id,read_at,created_at desc);create index if not exists notifications_user_due_idx on public.notifications(user_id,due_at)where read_at is null;

create table if not exists private.audit_log(id bigint generated always as identity primary key,user_id uuid,table_name text not null,operation text not null check(operation in('INSERT','UPDATE','DELETE')),row_id uuid,old_data jsonb,new_data jsonb,occurred_at timestamptz not null default now());
create index if not exists audit_log_user_time_idx on private.audit_log(user_id,occurred_at desc);
create table if not exists private.api_rate_limits(id bigint generated always as identity primary key,user_id uuid not null,route text not null,requested_at timestamptz not null default now());
create index if not exists api_rate_limits_lookup_idx on private.api_rate_limits(user_id,route,requested_at desc);

create or replace function private.set_updated_at()returns trigger language plpgsql set search_path=pg_catalog as $$begin new.updated_at=now();return new;end$$;
create or replace function private.audit_row()returns trigger language plpgsql security definer set search_path=pg_catalog,private as $$declare v_user_id uuid;v_row_id uuid;begin v_user_id:=coalesce(case when tg_op='DELETE'then old.user_id else new.user_id end,auth.uid());v_row_id:=case when tg_op='DELETE'then old.id else new.id end;insert into private.audit_log(user_id,table_name,operation,row_id,old_data,new_data)values(v_user_id,tg_table_name,tg_op,v_row_id,case when tg_op in('UPDATE','DELETE')then to_jsonb(old)end,case when tg_op in('INSERT','UPDATE')then to_jsonb(new)end);return case when tg_op='DELETE'then old else new end;end$$;
create or replace function public.next_occurrence_date(p_current date,p_frequency public.recurrence_frequency,p_interval_count integer,p_anchor_day integer)returns date language plpgsql immutable strict set search_path=pg_catalog as $$declare v_candidate date;v_month_start date;v_month_end date;begin if p_interval_count<1 or p_anchor_day<1 or p_anchor_day>31 then raise exception 'invalid recurrence arguments'using errcode='22023';end if;if p_frequency='daily'then return p_current+p_interval_count;elsif p_frequency='weekly'then return p_current+(7*p_interval_count);elsif p_frequency='monthly'then v_month_start:=(date_trunc('month',p_current::timestamp)+make_interval(months=>p_interval_count))::date;else v_candidate:=(p_current+make_interval(years=>p_interval_count))::date;v_month_start:=date_trunc('month',v_candidate::timestamp)::date;end if;v_month_end:=(date_trunc('month',v_month_start::timestamp)+interval '1 month - 1 day')::date;return v_month_start+(least(p_anchor_day,extract(day from v_month_end)::integer)-1);end$$;
create or replace function public.next_subscription_date(p_current date,p_cycle public.subscription_cycle,p_interval_count integer,p_billing_day integer)returns date language plpgsql immutable strict set search_path=pg_catalog as $$begin return public.next_occurrence_date(p_current,case when p_cycle='monthly'then'monthly'::public.recurrence_frequency else'yearly'::public.recurrence_frequency end,p_interval_count,p_billing_day);end$$;
create or replace function public.consume_api_rate_limit_admin(p_user_id uuid,p_route text,p_limit integer default 120,p_window_seconds integer default 60)returns boolean language plpgsql security definer set search_path=pg_catalog,private as $$declare v_count integer;begin if p_user_id is null or p_route is null or char_length(p_route)>120 or p_limit<1 or p_limit>1000 or p_window_seconds<1 or p_window_seconds>86400 then return false;end if;perform pg_advisory_xact_lock(hashtextextended(p_user_id::text||':'||p_route,0));delete from private.api_rate_limits where requested_at<now()-interval'1 day';select count(*)into v_count from private.api_rate_limits where user_id=p_user_id and route=p_route and requested_at>=now()-make_interval(secs=>p_window_seconds);if v_count>=p_limit then return false;end if;insert into private.api_rate_limits(user_id,route)values(p_user_id,p_route);return true;end$$;

alter table public.profiles enable row level security;alter table public.user_settings enable row level security;alter table public.categories enable row level security;alter table public.transactions enable row level security;alter table public.recurring_rules enable row level security;alter table public.subscriptions enable row level security;alter table public.budgets enable row level security;alter table public.notifications enable row level security;
create policy profiles_select_own on public.profiles for select using((select auth.uid())=user_id);create policy profiles_update_own on public.profiles for update using((select auth.uid())=user_id)with check((select auth.uid())=user_id);
create policy settings_select_own on public.user_settings for select using((select auth.uid())=user_id);create policy settings_update_own on public.user_settings for update using((select auth.uid())=user_id)with check((select auth.uid())=user_id);
do $$declare t text;prefix text;begin foreach t in array array['categories','transactions','subscriptions','budgets','notifications']loop execute format('create policy %I_select_own on public.%I for select using((select auth.uid())=user_id)',t,t);execute format('create policy %I_insert_own on public.%I for insert with check((select auth.uid())=user_id)',t,t);execute format('create policy %I_update_own on public.%I for update using((select auth.uid())=user_id)with check((select auth.uid())=user_id)',t,t);execute format('create policy %I_delete_own on public.%I for delete using((select auth.uid())=user_id)',t,t);end loop;end$$;
create policy recurring_select_own on public.recurring_rules for select using((select auth.uid())=user_id);create policy recurring_insert_own on public.recurring_rules for insert with check((select auth.uid())=user_id);create policy recurring_update_own on public.recurring_rules for update using((select auth.uid())=user_id)with check((select auth.uid())=user_id);create policy recurring_delete_own on public.recurring_rules for delete using((select auth.uid())=user_id);

grant select,insert,update,delete on public.categories,public.transactions,public.recurring_rules,public.subscriptions,public.budgets,public.notifications to authenticated;grant select,update on public.profiles,public.user_settings to authenticated;
revoke all on schema private from public,anon,authenticated;revoke all privileges on all tables in schema private from public,anon,authenticated;revoke all privileges on all functions in schema private from public,anon,authenticated;grant usage on schema private to service_role;grant select,insert,update,delete on private.api_rate_limits to service_role;grant select,insert on private.audit_log to service_role;revoke all on function public.consume_api_rate_limit_admin(uuid,text,integer,integer)from public,anon,authenticated;grant execute on function public.consume_api_rate_limit_admin(uuid,text,integer,integer)to service_role;

commit;
