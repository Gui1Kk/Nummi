# Migrations

O schema inicial foi aplicado ao projeto Supabase `Nummi` em 31 de julho de 2026 e contém `profiles`, `user_settings`, `categories`, `transactions`, `recurring_rules`, `subscriptions`, `budgets`, `notifications`, schema privado de auditoria e rate limiting, RLS, índices, triggers e a RPC idempotente `post_due_items`.

Antes de qualquer nova alteração, execute `supabase db pull initial_nummi_schema` para materializar o estado de produção em SQL versionado. Não recrie o schema por memória.
