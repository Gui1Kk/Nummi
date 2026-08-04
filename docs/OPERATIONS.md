# Operação

## Deploy

1. executar migrations em ordem em um ambiente de validação;
2. implantar `supabase/functions/api-v1` com `verify_jwt=true`;
3. configurar `ALLOWED_ORIGINS` quando houver domínio definitivo;
4. configurar Auth Site URL, redirects, SMTP, templates, CAPTCHA e leaked-password protection;
5. executar `npm run check`;
6. publicar o frontend na Vercel;
7. executar smoke público da API, Playwright e advisors;
8. validar cadastro, confirmação, login, recuperação e uma operação financeira completa.

## Observabilidade

- use `X-Request-Id` para correlacionar erros entre cliente e Edge Function;
- revise logs de Auth, API, Postgres e Edge Function;
- rode Security/Performance Advisors após DDL;
- monitore falhas de e-mail, HTTP 500, 401 inesperados, 429 e tempo de resposta;
- alerte quando snapshot se aproximar de 5.000 lançamentos por usuário;
- nunca registre senha, JWT, link mágico, chave de recuperação ou `service_role`;
- sanitize e-mails e textos livres antes de exportar logs para terceiros.

## Runbook de incidente

### Login ou confirmação não funciona

1. verifique `Authentication > URL Configuration`;
2. confirme que a Site URL aponta para o domínio oficial e não para localhost;
3. filtre os logs de Auth pelo horário e `request_id`;
4. diferencie `email_not_confirmed`, token expirado, redirect não permitido e rate limit;
5. não confirme contas manualmente antes de entender a causa;
6. depois da correção, reenvie um link novo porque links antigos mantêm o destino anterior.

### API retorna 500

1. capture `X-Request-Id` da resposta;
2. abra os logs da Edge Function no mesmo horário;
3. execute o preflight permitido e hostil;
4. confirme que a função inicia antes de testar regras de negócio;
5. verifique a última migration e a versão da Edge Function;
6. reverta a função para a versão anterior se o worker não inicializar.

### Dados aparentemente ausentes

1. confirme o usuário autenticado;
2. verifique RLS com dois usuários e o ID do proprietário;
3. confira filtros de competência, status planejado/realizado e fuso horário;
4. não desabilite RLS para diagnosticar;
5. use consulta administrativa somente com escopo e horário documentados.

### Recorrências duplicadas

1. não apague em massa antes de identificar a origem;
2. confirme `recurrence_id` ou `subscription_id` e `occurrence_date`;
3. repita `post_due_items` na mesma janela e espere zero novas linhas;
4. confira constraints e índices únicos;
5. corrija por migration e preserve evidência para auditoria.

### Degradação de desempenho

1. meça p50, p95 e p99 da rota afetada;
2. identifique volume por usuário e tamanho do snapshot;
3. rode `EXPLAIN (ANALYZE, BUFFERS)` em staging com dados representativos;
4. confira estatísticas de índices antes de remover ou criar novos;
5. reduza o intervalo consultado antes de aumentar limites globais.

## Backup e restauração

- habilite o plano de backup compatível com a criticidade do projeto no Supabase;
- registre retenção, região, responsável e objetivo de ponto de recuperação;
- antes de migrations destrutivas, crie backup ou branch de banco;
- exportações CSV do usuário não substituem backup do banco;
- nunca considere backup válido sem teste de restauração.

### Teste de restauração recomendado

1. restaurar o backup em projeto ou branch isolada;
2. contar usuários, perfis, categorias e lançamentos;
3. comparar totais financeiros por usuário e competência;
4. validar constraints, triggers, functions, grants e policies;
5. executar testes de RLS e recorrências;
6. destruir o ambiente de teste após registrar o resultado.

## Rollback

### Frontend

- reverter o commit ou promover o deployment Vercel anterior;
- executar smoke de acesso e CSP após o rollback.

### Edge Function

- reimplantar a versão anterior conhecida como saudável;
- testar preflight permitido, origem hostil e JWT ausente.

### Banco

- nunca editar migrations já aplicadas;
- criar migration corretiva reversível;
- evitar rollback destrutivo se a aplicação puder ser compatível com duas versões durante a correção.

## Critérios de liberação

Uma release só pode ser chamada de validada quando:

- Vercel conclui o gate `npm run check`;
- API e repositório declaram a mesma versão;
- advisors foram revisados;
- nenhum artefato temporário está ativo;
- cadastro e recuperação retornam ao domínio correto;
- um smoke pós-deploy cria, edita e exclui um lançamento sem acessar dados de outro usuário.
