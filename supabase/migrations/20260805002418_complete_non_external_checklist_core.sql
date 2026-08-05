begin;

alter table public.profiles add column if not exists account_role text not null default 'user';
do $$ begin
  if not exists (select 1 from pg_constraint where conrelid='public.profiles'::regclass and conname='profiles_account_role_check') then
    alter table public.profiles add constraint profiles_account_role_check check(account_role in('user','admin'));
  end if;
end $$;
revoke update on public.profiles from authenticated;
grant select on public.profiles to authenticated;
grant update(display_name,currency,locale,timezone) on public.profiles to authenticated;

insert into public.profiles(user_id,display_name,currency,locale,timezone)
select u.id,left(coalesce(nullif(trim(u.raw_user_meta_data->>'display_name'),''),split_part(coalesce(u.email,'Usuário'),'@',1)),80),'BRL','pt-BR','America/Porto_Velho'
from auth.users u left join public.profiles p on p.user_id=u.id where p.user_id is null and u.deleted_at is null;

create or replace function private.handle_new_user() returns trigger language plpgsql security definer set search_path=pg_catalog,public as $function$
begin
 insert into public.profiles(user_id,display_name,currency,locale,timezone,account_role)
 values(new.id,left(coalesce(nullif(trim(new.raw_user_meta_data->>'display_name'),''),split_part(coalesce(new.email,'Usuário'),'@',1)),80),'BRL','pt-BR','America/Porto_Velho','user')
 on conflict(user_id) do update set display_name=case when public.profiles.display_name='' then excluded.display_name else public.profiles.display_name end;
 insert into public.user_settings(user_id,theme) values(new.id,'dark') on conflict(user_id) do nothing;
 insert into public.categories(user_id,name,scope,color) values
 (new.id,'Salário','income','#22c55e'),(new.id,'Renda extra','income','#14b8a6'),(new.id,'Moradia','expense','#8b5cf6'),(new.id,'Alimentação','expense','#f97316'),(new.id,'Mercado','expense','#eab308'),(new.id,'Transporte','expense','#3b82f6'),(new.id,'Saúde','expense','#ef4444'),(new.id,'Educação','expense','#06b6d4'),(new.id,'Lazer','expense','#ec4899'),(new.id,'Assinaturas','expense','#6366f1'),(new.id,'Outros','both','#64748b') on conflict do nothing;
 return new;
end;$function$;

create unique index if not exists notifications_entity_due_uidx on public.notifications(user_id,kind,entity_type,entity_id,due_at) where entity_id is not null and due_at is not null;

create or replace function private.post_due_items_for_user(p_user_id uuid,p_through date,p_max_occurrences integer default 120)
returns table(transactions_created integer,recurrences_advanced integer,subscriptions_advanced integer)
language plpgsql security definer set search_path=pg_catalog,public,private as $function$
declare v_rule public.recurring_rules%rowtype;v_sub public.subscriptions%rowtype;v_date date;v_next date;v_inserted integer:=0;v_rec_count integer:=0;v_sub_count integer:=0;v_iterations integer:=0;
begin
 if p_user_id is null then raise exception 'user id is required' using errcode='22023';end if;
 if p_through is null or p_through>current_date+366 or p_through<current_date-3660 then raise exception 'invalid through date' using errcode='22023';end if;
 if p_max_occurrences<1 or p_max_occurrences>500 then raise exception 'invalid occurrence limit' using errcode='22023';end if;
 for v_rule in select * from public.recurring_rules where user_id=p_user_id and active and auto_post and next_date<=p_through order by next_date,id for update loop
  v_date:=v_rule.next_date;
  while v_date<=p_through and(v_rule.end_date is null or v_date<=v_rule.end_date) loop
   v_iterations:=v_iterations+1;if v_iterations>p_max_occurrences then raise exception 'occurrence limit exceeded' using errcode='54000';end if;
   insert into public.transactions(user_id,description,amount,kind,category_id,transaction_date,recurrence_id,occurrence_date,source,status,note)
   values(p_user_id,v_rule.description,v_rule.amount,v_rule.kind,v_rule.category_id,v_date,v_rule.id,v_date,'recurrence','posted',v_rule.note) on conflict do nothing;
   if found then v_inserted:=v_inserted+1;end if;
   v_next:=public.next_occurrence_date(v_date,v_rule.frequency,v_rule.interval_count,v_rule.anchor_day);if v_next<=v_date then raise exception 'non-advancing recurrence';end if;v_date:=v_next;
  end loop;
  update public.recurring_rules set next_date=v_date,last_posted_at=case when v_date<>v_rule.next_date then now() else last_posted_at end,active=case when v_rule.end_date is not null and v_date>v_rule.end_date then false else active end where id=v_rule.id and user_id=p_user_id;v_rec_count:=v_rec_count+1;
 end loop;
 for v_sub in select * from public.subscriptions where user_id=p_user_id and active and auto_post and next_charge<=p_through order by next_charge,id for update loop
  v_date:=v_sub.next_charge;
  while v_date<=p_through and(v_sub.end_date is null or v_date<=v_sub.end_date) loop
   v_iterations:=v_iterations+1;if v_iterations>p_max_occurrences then raise exception 'occurrence limit exceeded' using errcode='54000';end if;
   insert into public.transactions(user_id,description,amount,kind,category_id,transaction_date,subscription_id,occurrence_date,source,status,note)
   values(p_user_id,v_sub.name,v_sub.amount,'expense',v_sub.category_id,v_date,v_sub.id,v_date,'subscription','posted',v_sub.note) on conflict do nothing;
   if found then v_inserted:=v_inserted+1;end if;
   v_next:=public.next_subscription_date(v_date,v_sub.cycle,v_sub.interval_count,v_sub.billing_day);if v_next<=v_date then raise exception 'non-advancing subscription';end if;v_date:=v_next;
  end loop;
  update public.subscriptions set next_charge=v_date,last_posted_at=case when v_date<>v_sub.next_charge then now() else last_posted_at end,active=case when v_sub.end_date is not null and v_date>v_sub.end_date then false else active end where id=v_sub.id and user_id=p_user_id;v_sub_count:=v_sub_count+1;
 end loop;
 return query select v_inserted,v_rec_count,v_sub_count;
end;$function$;

create or replace function private.refresh_notifications_for_user(p_user_id uuid,p_today date) returns integer language plpgsql security definer set search_path=pg_catalog,public,private as $function$
declare v_count integer:=0;v_inserted integer:=0;
begin
 if p_user_id is null or p_today is null then raise exception 'user and date are required' using errcode='22023';end if;
 insert into public.notifications(user_id,kind,title,message,due_at,entity_type,entity_id)
 select s.user_id,'subscription_due','Assinatura próxima',s.name||' será cobrada em '||to_char(s.next_charge,'DD/MM/YYYY')||'.',s.next_charge::timestamp at time zone coalesce(p.timezone,'UTC'),'subscription',s.id
 from public.subscriptions s left join public.profiles p on p.user_id=s.user_id where s.user_id=p_user_id and s.active and s.next_charge between p_today and p_today+s.reminder_days on conflict do nothing;
 get diagnostics v_inserted=row_count;v_count:=v_count+v_inserted;
 insert into public.notifications(user_id,kind,title,message,due_at,entity_type,entity_id)
 select r.user_id,'recurrence_due','Recorrência próxima',r.description||' está prevista para '||to_char(r.next_date,'DD/MM/YYYY')||'.',r.next_date::timestamp at time zone coalesce(p.timezone,'UTC'),'recurrence',r.id
 from public.recurring_rules r join public.user_settings us on us.user_id=r.user_id left join public.profiles p on p.user_id=r.user_id where r.user_id=p_user_id and r.active and r.next_date between p_today and p_today+us.reminder_days on conflict do nothing;
 get diagnostics v_inserted=row_count;v_count:=v_count+v_inserted;
 delete from public.notifications where user_id=p_user_id and read_at is not null and read_at<now()-interval '90 days';return v_count;
end;$function$;

create or replace function private.run_scheduled_finance_maintenance() returns jsonb language plpgsql security definer set search_path=pg_catalog,public,private as $function$
declare v_user record;v_today date;v_created integer;v_rec integer;v_sub integer;v_notifications integer;v_users integer:=0;v_total_created integer:=0;v_total_notifications integer:=0;
begin
 for v_user in select u.id,coalesce(p.timezone,'UTC') timezone from auth.users u left join public.profiles p on p.user_id=u.id where u.deleted_at is null loop
  v_today:=(clock_timestamp() at time zone v_user.timezone)::date;
  select transactions_created,recurrences_advanced,subscriptions_advanced into v_created,v_rec,v_sub from private.post_due_items_for_user(v_user.id,v_today,500);
  v_notifications:=private.refresh_notifications_for_user(v_user.id,v_today);v_users:=v_users+1;v_total_created:=v_total_created+coalesce(v_created,0);v_total_notifications:=v_total_notifications+coalesce(v_notifications,0);
 end loop;
 return jsonb_build_object('users_processed',v_users,'transactions_created',v_total_created,'notifications_created',v_total_notifications,'ran_at',clock_timestamp());
end;$function$;

create or replace function public.get_financial_summary(p_from date,p_to date)
returns table(income numeric(18,2),expense numeric(18,2),balance numeric(18,2),planned_income numeric(18,2),planned_expense numeric(18,2),transaction_count bigint)
language plpgsql security invoker set search_path=pg_catalog,public as $function$
declare v_uid uuid:=auth.uid();begin
 if v_uid is null then raise exception 'authentication required' using errcode='28000';end if;if p_from is null or p_to is null or p_from>p_to then raise exception 'invalid date range' using errcode='22023';end if;if p_to-p_from>3660 then raise exception 'date range exceeds 10 years' using errcode='22023';end if;
 return query select coalesce(sum(t.amount)filter(where t.kind='income'and t.status='posted'),0)::numeric(18,2),coalesce(sum(t.amount)filter(where t.kind='expense'and t.status='posted'),0)::numeric(18,2),(coalesce(sum(t.amount)filter(where t.kind='income'and t.status='posted'),0)-coalesce(sum(t.amount)filter(where t.kind='expense'and t.status='posted'),0))::numeric(18,2),coalesce(sum(t.amount)filter(where t.kind='income'and t.status='planned'),0)::numeric(18,2),coalesce(sum(t.amount)filter(where t.kind='expense'and t.status='planned'),0)::numeric(18,2),count(*) from public.transactions t where t.user_id=v_uid and t.transaction_date between p_from and p_to;
end;$function$;

create or replace function public.get_budget_status(p_month date)
returns table(category_id uuid,base_amount numeric(18,2),rollover_amount numeric(18,2),effective_amount numeric(18,2),spent numeric(18,2),remaining numeric(18,2),rollover boolean)
language plpgsql security invoker set search_path=pg_catalog,public as $function$
declare v_uid uuid:=auth.uid();begin
 if v_uid is null then raise exception 'authentication required' using errcode='28000';end if;if p_month is null or extract(day from p_month)<>1 then raise exception 'month must be the first day of a month' using errcode='22023';end if;
 return query with recursive budget_months as(
  select b.user_id,b.category_id,b.month,b.amount::numeric(18,2) amount,b.rollover,coalesce((select sum(t.amount)from public.transactions t where t.user_id=b.user_id and t.category_id=b.category_id and t.kind='expense'and t.status='posted'and t.transaction_date>=b.month and t.transaction_date<(b.month+interval '1 month')::date),0)::numeric(18,2) spent,row_number()over(partition by b.category_id order by b.month)rn from public.budgets b where b.user_id=v_uid and b.month<=p_month
 ),roll as(
  select m.user_id,m.category_id,m.month,m.amount,m.rollover,m.spent,m.rn,0::numeric(18,2) carry,m.amount::numeric(18,2) effective from budget_months m where m.rn=1
  union all
  select m.user_id,m.category_id,m.month,m.amount,m.rollover,m.spent,m.rn,case when r.rollover then greatest(r.effective-r.spent,0)else 0 end::numeric(18,2),(m.amount+case when r.rollover then greatest(r.effective-r.spent,0)else 0 end)::numeric(18,2) from roll r join budget_months m on m.category_id=r.category_id and m.rn=r.rn+1
 )select r.category_id,r.amount,r.carry,r.effective,r.spent,(r.effective-r.spent)::numeric(18,2),r.rollover from roll r where r.month=p_month;
end;$function$;

revoke all on function private.post_due_items_for_user(uuid,date,integer) from public,anon,authenticated;
revoke all on function private.refresh_notifications_for_user(uuid,date) from public,anon,authenticated;
revoke all on function private.run_scheduled_finance_maintenance() from public,anon,authenticated;
revoke all on function public.get_financial_summary(date,date) from public,anon;grant execute on function public.get_financial_summary(date,date) to authenticated;
revoke all on function public.get_budget_status(date) from public,anon;grant execute on function public.get_budget_status(date) to authenticated;
create extension if not exists pg_cron with schema extensions;
do $$declare v_job_id bigint;begin for v_job_id in select jobid from cron.job where jobname='nummi-hourly-finance-maintenance' loop perform cron.unschedule(v_job_id);end loop;perform cron.schedule('nummi-hourly-finance-maintenance','17 * * * *',$cron$select private.run_scheduled_finance_maintenance();$cron$);end$$;

commit;
