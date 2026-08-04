# Desempenho

## Frontend

- telas financeiras são carregadas com `React.lazy` e `Suspense`;
- React, Supabase e funcionalidades viram chunks separados no build;
- fontes externas foram removidas do caminho crítico;
- filtros e cálculos mensais usam `useMemo`/`useCallback` onde há benefício;
- somas monetárias são realizadas em centavos inteiros para evitar drift binário;
- animações respeitam `prefers-reduced-motion`;
- orçamento automático impede chunks JS individuais acima de 700 KB e total acima de 1,8 MB sem compressão.

## Medição comprovada

No gate executado pela Vercel:

- TypeScript e build de produção passaram;
- 1.718 módulos foram transformados;
- JavaScript total sem compressão: aproximadamente 505 KB antes dos últimos ajustes;
- maior chunk: biblioteca Supabase, aproximadamente 213 KB;
- lint e testes unitários passaram;
- o orçamento de bundle passou com ampla margem.

O valor exato deve ser atualizado após o build final da `main`.

## API e banco

- todas as listagens são paginadas e limitadas;
- payload máximo de 1 MB;
- importação máxima de 500 linhas por chamada;
- snapshot possui limites explícitos e sinaliza truncamento;
- o resumo recusa mais de 10.000 lançamentos em vez de devolver total parcial;
- consultas comuns têm índices por usuário, status, data, vencimento e categoria;
- sete consultas independentes do snapshot são executadas em paralelo;
- recorrências são processadas em transação no banco, não em loops do navegador;
- rate limiting é feito em schema privado.

## Advisor de índices

O Performance Advisor reporta vários índices como “unused”. As tabelas financeiras ainda têm pouco ou nenhum dado, então o contador de uso não é evidência suficiente para removê-los. Parte desses índices cobre:

- filtros por usuário e data;
- chaves estrangeiras compostas;
- vencimentos de recorrências e assinaturas;
- orçamentos por competência;
- limpeza e consulta de auditoria/rate limit.

Nenhum índice foi removido apenas para silenciar o advisor. Reavalie após tráfego real e uma janela representativa de estatísticas. Use `pg_stat_user_indexes`, planos `EXPLAIN (ANALYZE, BUFFERS)` e custo de escrita antes de decidir.

## Próximos gatilhos de escala

Ao ultrapassar 5.000 lançamentos por usuário:

1. substituir o snapshot inicial por consultas mensais paginadas;
2. usar resumo SQL/RPC em vez de agregar no navegador;
3. considerar paginação por cursor nas listas extensas;
4. medir p95 e p99 da Edge Function;
5. medir Core Web Vitals e Lighthouse em desktop e mobile;
6. testar cenários com 10, 1.000 e 5.000 lançamentos;
7. só então revisar limites, cache e índices.
