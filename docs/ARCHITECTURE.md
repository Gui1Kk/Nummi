# Arquitetura

## Fluxo

1. O navegador autentica diretamente no Supabase Auth usando PKCE.
2. O frontend acessa tabelas públicas pela Data API com o JWT do usuário.
3. PostgreSQL aplica grants e RLS; toda entidade privada possui `user_id`.
4. Operações compostas usam RPCs estreitas, como `post_due_items`.
5. Integrações externas usam a Edge Function `api-v1`, nunca a chave privilegiada no cliente.

## Domínios

- `transactions`: fatos e previsões financeiras;
- `categories`: classificação personalizada;
- `recurring_rules`: regras de lançamentos repetidos;
- `subscriptions`: serviços com cobrança periódica;
- `budgets`: limite mensal por categoria;
- `profiles` e `user_settings`: preferências;
- `notifications`: alertas do usuário;
- `private.audit_log`: trilha de alterações sem exposição pela Data API.

## Decisões

- valores monetários são `numeric(14,2)`, nunca ponto flutuante;
- valores armazenados são positivos; `kind` define entrada ou saída;
- competência é derivada da data da transação;
- uma ocorrência de recorrência/assinatura é única por regra e data;
- importações usam chave idempotente por conteúdo;
- consultas de tela têm limites explícitos;
- a API é versionada em `/v1`.
