-- Executar em ambiente de teste que possua teste@teste.com.
-- Todos os dados artificiais são revertidos.
begin;

create temporary table test_context(user_id uuid, category_id uuid) on commit drop;
insert into test_context
select u.id,c.id from auth.users u join public.categories c on c.user_id=u.id and c.name='Mercado'
where u.email='teste@teste.com';

do $$
declare v_user uuid;v_category uuid;v_summary record;v_rollover record;v_first record;v_second record;
begin
 select user_id,category_id into v_user,v_category from test_context;
 if v_user is null then raise exception 'test user not found';end if;
 perform set_config('request.jwt.claims',json_build_object('sub',v_user,'role','authenticated')::text,true);

 insert into public.transactions(user_id,description,amount,kind,status,source,transaction_date,idempotency_key)
 values(v_user,'Precisão 1',0.10,'income','posted','manual','2026-08-01','precision-0001'),
       (v_user,'Precisão 2',0.20,'income','posted','manual','2026-08-01','precision-0002');
 select * into v_summary from public.get_financial_summary('2026-08-01','2026-08-31');
 if v_summary.income<>0.30 or v_summary.balance<>0.30 then raise exception 'numeric summary failed: %',row_to_json(v_summary);end if;

 insert into public.budgets(user_id,category_id,month,amount,rollover)values
 (v_user,v_category,'2026-07-01',1000,true),(v_user,v_category,'2026-08-01',800,true);
 insert into public.transactions(user_id,description,amount,kind,status,source,category_id,transaction_date,idempotency_key)
 values(v_user,'Mercado julho',400,'expense','posted','manual',v_category,'2026-07-10','rollover-proof-001');
 select * into v_rollover from public.get_budget_status('2026-08-01')where category_id=v_category;
 if v_rollover.rollover_amount<>600 or v_rollover.effective_amount<>1400 then raise exception 'rollover failed: %',row_to_json(v_rollover);end if;

 insert into public.recurring_rules(user_id,description,amount,kind,frequency,interval_count,anchor_day,start_date,next_date,auto_post,active)
 values(v_user,'Recorrência de teste',99.99,'expense','monthly',1,31,'2026-01-31','2026-01-31',true,true);
 select * into v_first from public.post_due_items('2026-04-30',100);
 select * into v_second from public.post_due_items('2026-04-30',100);
 if v_first.transactions_created<>4 or v_second.transactions_created<>0 then raise exception 'recurrence idempotency failed';end if;
end$$;

rollback;
