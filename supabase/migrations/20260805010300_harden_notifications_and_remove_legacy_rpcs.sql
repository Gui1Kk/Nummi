begin;

revoke insert, update on public.notifications from authenticated;
grant select, delete on public.notifications to authenticated;
grant update(read_at) on public.notifications to authenticated;
drop policy if exists notifications_insert_own on public.notifications;

drop function if exists public.post_due_items_admin(uuid,date,integer);
drop function if exists public.financial_summary(date,date);

commit;
