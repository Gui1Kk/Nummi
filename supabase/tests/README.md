# Testes de banco

## Scripts versionados

- `finance_invariants.sql`: precisão monetária, rollover e idempotência de recorrências;
- `rls_matrix.sql`: isolamento entre usuários, role protegida, notificações e FKs compostas;
- `performance_smoke.sql`: 5.000 lançamentos e plano de consulta mensal.

Todos usam transações revertidas ou orientam explicitamente o ambiente de execução.

## Evidências executadas no projeto real em 5 de agosto de 2026

- `0,10 + 0,20` retornou exatamente `0,30` por agregação PostgreSQL `numeric`;
- orçamento de julho de R$ 1.000 com gasto de R$ 400 carregou R$ 600 para agosto;
- orçamento base de agosto de R$ 800 resultou em limite efetivo de R$ 1.400;
- primeira execução da recorrência do dia 31 criou 4 ocorrências; replay criou 0;
- dois workers concorrentes do `pg_cron`, com 8 execuções sobrepostas, criaram uma única ocorrência;
- scheduler gerou 2 lançamentos e 2 notificações em uma prova transacional;
- leitura, atualização e exclusão cruzadas retornaram zero para todas as tabelas financeiras;
- escalada de `account_role`, inserção de notificações pelo cliente e `user_id` forjado foram bloqueados;
- referências a categorias de outro usuário foram bloqueadas pelas FKs compostas;
- valores negativos e intervalo de recorrência inválido foram bloqueados por constraints;
- consulta mensal com 5.000 lançamentos usou `transactions_user_date_idx`, sem leitura de disco, em aproximadamente 0,175 ms no ambiente da prova.

## Limitações honestas

A suíte Playwright autenticada está versionada, porém sua execução depende de um runner com Chromium funcional e dos segredos `E2E_TEST_EMAIL` e `E2E_TEST_PASSWORD`. Esses segredos não são gravados no repositório.
