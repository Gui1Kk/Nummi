# Operação

## Deploy

1. executar migrations em ordem;
2. implantar `supabase/functions/api-v1` com `verify_jwt=true`;
3. configurar `ALLOWED_ORIGINS` quando houver domínio definitivo;
4. configurar Auth Site URL, redirects, SMTP, templates, CAPTCHA e leaked-password protection;
5. publicar o frontend na Vercel;
6. executar smoke de API, Playwright e advisors.

## Observabilidade

- use `X-Request-Id` para correlacionar erros;
- revise logs de Auth, API, Postgres e Edge Function;
- rode Security/Performance Advisors após DDL;
- monitore falhas de e-mail e rate limits;
- alerte quando snapshot se aproximar de 5.000 lançamentos por usuário.

## Rollback

Frontend: reverter o commit/deploy Vercel. Edge Function: implantar a versão anterior. Banco: escrever migration corretiva; não editar migrations já aplicadas.
