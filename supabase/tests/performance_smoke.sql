-- Smoke de desempenho. Executar em ambiente descartável com teste@teste.com.
-- Os 5.000 registros são revertidos ao final.
begin;

insert into public.transactions(user_id,description,amount,kind,status,source,transaction_date,idempotency_key)
select u.id,'Carga '||g,((g%100)+0.01)::numeric,
       case when g%5=0 then 'income'::public.transaction_kind else 'expense'::public.transaction_kind end,
       case when g%7=0 then 'planned'::public.transaction_status else 'posted'::public.transaction_status end,
       'manual'::public.transaction_source,date '2026-08-01'+((g-1)%31),'load-'||lpad(g::text,8,'0')
from auth.users u cross join generate_series(1,5000)g where u.email='teste@teste.com';

explain(analyze,buffers,format json)
select * from public.transactions
where user_id=(select id from auth.users where email='teste@teste.com')
  and transaction_date between '2026-08-01' and '2026-08-31'
order by transaction_date desc,created_at desc
limit 100;

rollback;
