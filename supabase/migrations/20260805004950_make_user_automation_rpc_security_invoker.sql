begin;

create or replace function public.post_due_items(
  p_through date default current_date,
  p_max_occurrences integer default 120
)
returns table(transactions_created integer,recurrences_advanced integer,subscriptions_advanced integer)
language plpgsql
security invoker
set search_path=pg_catalog,public
as $function$
declare
  v_uid uuid:=auth.uid();v_rule public.recurring_rules%rowtype;v_sub public.subscriptions%rowtype;
  v_date date;v_next date;v_inserted integer:=0;v_rec_count integer:=0;v_sub_count integer:=0;v_iterations integer:=0;
begin
  if v_uid is null then raise exception 'authentication required' using errcode='28000';end if;
  if p_through is null or p_through>current_date+366 or p_through<current_date-3660 then raise exception 'invalid through date' using errcode='22023';end if;
  if p_max_occurrences<1 or p_max_occurrences>500 then raise exception 'invalid occurrence limit' using errcode='22023';end if;
  for v_rule in select * from public.recurring_rules where user_id=v_uid and active and auto_post and next_date<=p_through order by next_date,id for update loop
    v_date:=v_rule.next_date;
    while v_date<=p_through and(v_rule.end_date is null or v_date<=v_rule.end_date) loop
      v_iterations:=v_iterations+1;if v_iterations>p_max_occurrences then raise exception 'occurrence limit exceeded' using errcode='54000';end if;
      insert into public.transactions(user_id,description,amount,kind,category_id,transaction_date,recurrence_id,occurrence_date,source,status,note)
      values(v_uid,v_rule.description,v_rule.amount,v_rule.kind,v_rule.category_id,v_date,v_rule.id,v_date,'recurrence','posted',v_rule.note)on conflict do nothing;
      if found then v_inserted:=v_inserted+1;end if;v_next:=public.next_occurrence_date(v_date,v_rule.frequency,v_rule.interval_count,v_rule.anchor_day);if v_next<=v_date then raise exception 'non-advancing recurrence';end if;v_date:=v_next;
    end loop;
    update public.recurring_rules set next_date=v_date,last_posted_at=case when v_date<>v_rule.next_date then now()else last_posted_at end,active=case when v_rule.end_date is not null and v_date>v_rule.end_date then false else active end where id=v_rule.id and user_id=v_uid;v_rec_count:=v_rec_count+1;
  end loop;
  for v_sub in select * from public.subscriptions where user_id=v_uid and active and auto_post and next_charge<=p_through order by next_charge,id for update loop
    v_date:=v_sub.next_charge;
    while v_date<=p_through and(v_sub.end_date is null or v_date<=v_sub.end_date) loop
      v_iterations:=v_iterations+1;if v_iterations>p_max_occurrences then raise exception 'occurrence limit exceeded' using errcode='54000';end if;
      insert into public.transactions(user_id,description,amount,kind,category_id,transaction_date,subscription_id,occurrence_date,source,status,note)
      values(v_uid,v_sub.name,v_sub.amount,'expense',v_sub.category_id,v_date,v_sub.id,v_date,'subscription','posted',v_sub.note)on conflict do nothing;
      if found then v_inserted:=v_inserted+1;end if;v_next:=public.next_subscription_date(v_date,v_sub.cycle,v_sub.interval_count,v_sub.billing_day);if v_next<=v_date then raise exception 'non-advancing subscription';end if;v_date:=v_next;
    end loop;
    update public.subscriptions set next_charge=v_date,last_posted_at=case when v_date<>v_sub.next_charge then now()else last_posted_at end,active=case when v_sub.end_date is not null and v_date>v_sub.end_date then false else active end where id=v_sub.id and user_id=v_uid;v_sub_count:=v_sub_count+1;
  end loop;
  return query select v_inserted,v_rec_count,v_sub_count;
end;$function$;

revoke all on function public.post_due_items(date,integer) from public,anon;
grant execute on function public.post_due_items(date,integer) to authenticated;

commit;
