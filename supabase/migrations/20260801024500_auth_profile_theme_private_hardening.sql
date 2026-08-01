begin;

alter table public.user_settings alter column theme set default 'dark';
update public.user_settings set theme = 'dark', updated_at = now() where theme = 'system';

insert into public.profiles (user_id, display_name, currency, locale, timezone)
select u.id,
       left(coalesce(nullif(trim(u.raw_user_meta_data->>'display_name'), ''), split_part(coalesce(u.email, 'Usuário'), '@', 1)), 80),
       'BRL', 'pt-BR', 'America/Porto_Velho'
from auth.users u
left join public.profiles p on p.user_id = u.id
where p.user_id is null and u.deleted_at is null;

create or replace function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = pg_catalog, public
as $function$
begin
  insert into public.profiles(user_id, display_name, currency, locale, timezone)
  values(new.id, left(coalesce(nullif(trim(new.raw_user_meta_data->>'display_name'), ''), split_part(coalesce(new.email, 'Usuário'), '@', 1)), 80), 'BRL', 'pt-BR', 'America/Porto_Velho')
  on conflict (user_id) do update set display_name = case when public.profiles.display_name = '' then excluded.display_name else public.profiles.display_name end;
  insert into public.user_settings(user_id, theme) values(new.id, 'dark') on conflict (user_id) do nothing;
  insert into public.categories(user_id, name, scope, color) values
    (new.id,'Salário','income','#22c55e'), (new.id,'Renda extra','income','#14b8a6'),
    (new.id,'Moradia','expense','#8b5cf6'), (new.id,'Alimentação','expense','#f97316'),
    (new.id,'Mercado','expense','#eab308'), (new.id,'Transporte','expense','#3b82f6'),
    (new.id,'Saúde','expense','#ef4444'), (new.id,'Educação','expense','#06b6d4'),
    (new.id,'Lazer','expense','#ec4899'), (new.id,'Assinaturas','expense','#6366f1'),
    (new.id,'Outros','both','#64748b')
  on conflict do nothing;
  return new;
end;
$function$;

revoke all on schema private from public, anon, authenticated;
revoke all privileges on all tables in schema private from public, anon, authenticated;
revoke all privileges on all sequences in schema private from public, anon, authenticated;
revoke all privileges on all functions in schema private from public, anon, authenticated;
alter default privileges in schema private revoke all on tables from public, anon, authenticated;
alter default privileges in schema private revoke all on sequences from public, anon, authenticated;
alter default privileges in schema private revoke all on functions from public, anon, authenticated;
grant usage on schema private to service_role;
grant select, insert, update, delete on private.api_rate_limits to service_role;
grant select, insert on private.audit_log to service_role;

create index if not exists transactions_user_status_date_idx on public.transactions(user_id, status, transaction_date desc);
create index if not exists subscriptions_user_active_due_idx on public.subscriptions(user_id, active, next_charge) where active;
create index if not exists recurring_rules_user_active_due_idx on public.recurring_rules(user_id, active, next_date) where active;
create index if not exists notifications_user_due_idx on public.notifications(user_id, due_at) where read_at is null;

commit;
