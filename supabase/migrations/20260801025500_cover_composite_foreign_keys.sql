create index if not exists recurring_rules_user_category_idx on public.recurring_rules(user_id, category_id);
create index if not exists subscriptions_user_category_idx on public.subscriptions(user_id, category_id);
