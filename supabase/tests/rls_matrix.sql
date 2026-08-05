-- Executar em ambiente de teste com admin@admin.com e teste@teste.com.
-- O script falha imediatamente se qualquer isolamento for quebrado.
begin;

create temporary table context(admin_id uuid,test_id uuid,admin_category uuid) on commit drop;
insert into context
select a.id,t.id,c.id
from auth.users a
join auth.users t on t.email='teste@teste.com'
join public.categories c on c.user_id=a.id and c.name='Mercado'
where a.email='admin@admin.com';
grant select on context to authenticated;

set local role authenticated;
select set_config('request.jwt.claims',json_build_object('sub',(select test_id from context),'role','authenticated')::text,true);

do $$
declare a uuid;t uuid;c uuid;affected integer;
begin
 select admin_id,test_id,admin_category into a,t,c from context;
 if a is null or t is null or c is null then raise exception 'test context missing';end if;
 if exists(select 1 from public.profiles where user_id=a)then raise exception 'cross profile read';end if;
 if exists(select 1 from public.categories where user_id=a)then raise exception 'cross category read';end if;
 if exists(select 1 from public.transactions where user_id=a)then raise exception 'cross transaction read';end if;
 if exists(select 1 from public.recurring_rules where user_id=a)then raise exception 'cross recurrence read';end if;
 if exists(select 1 from public.subscriptions where user_id=a)then raise exception 'cross subscription read';end if;
 if exists(select 1 from public.budgets where user_id=a)then raise exception 'cross budget read';end if;
 if exists(select 1 from public.notifications where user_id=a)then raise exception 'cross notification read';end if;

 update public.profiles set display_name='cross' where user_id=a;get diagnostics affected=row_count;if affected<>0 then raise exception 'cross profile update';end if;
 delete from public.categories where user_id=a;get diagnostics affected=row_count;if affected<>0 then raise exception 'cross category delete';end if;

 begin update public.profiles set account_role='admin' where user_id=t;raise exception 'role escalation accepted';exception when insufficient_privilege then null;end;
 begin insert into public.notifications(user_id,kind,title,message)values(t,'info','forged','forged');raise exception 'client notification insert accepted';exception when insufficient_privilege then null;end;
 begin insert into public.categories(user_id,name,scope,color)values(a,'forged','both','#000000');raise exception 'forged user insert accepted';exception when insufficient_privilege then null;end;

 begin insert into public.transactions(user_id,description,amount,kind,status,source,category_id,transaction_date)values(t,'foreign',1,'expense','posted','manual',c,current_date);raise exception 'foreign transaction category accepted';exception when foreign_key_violation then null;end;
 begin insert into public.recurring_rules(user_id,description,amount,kind,category_id,frequency,interval_count,anchor_day,start_date,next_date)values(t,'foreign',1,'expense',c,'monthly',1,1,current_date,current_date);raise exception 'foreign recurrence category accepted';exception when foreign_key_violation then null;end;
 begin insert into public.subscriptions(user_id,name,amount,category_id,cycle,interval_count,billing_day,start_date,next_charge)values(t,'foreign',1,c,'monthly',1,1,current_date,current_date);raise exception 'foreign subscription category accepted';exception when foreign_key_violation then null;end;
 begin insert into public.budgets(user_id,category_id,month,amount)values(t,c,date_trunc('month',current_date)::date,1);raise exception 'foreign budget category accepted';exception when foreign_key_violation then null;end;
end$$;

rollback;
