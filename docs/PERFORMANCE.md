# Desempenho

## Frontend

- telas financeiras são carregadas com `React.lazy` e `Suspense`;
- React, Supabase e funcionalidades viram chunks separados no build;
- fontes externas foram removidas do caminho crítico;
- filtros e cálculos mensais usam `useMemo`/`useCallback` onde há benefício;
- animações respeitam `prefers-reduced-motion`;
- orçamento automático impede chunks JS individuais acima de 700 KB e total acima de 1,8 MB sem compressão.

## API e banco

- todas as listagens são paginadas e limitadas;
- payload máximo de 1 MB;
- importação máxima de 500 linhas por chamada;
- snapshot possui limites explícitos e sinaliza truncamento;
- consultas comuns têm índices por usuário, status, data, vencimento e categoria;
- sete consultas independentes do snapshot são executadas em paralelo;
- recorrências são processadas em transação no banco, não em loops do navegador;
- rate limiting é feito em schema privado.

## Próximos gatilhos de escala

Ao ultrapassar 5.000 lançamentos por usuário, substituir o snapshot inicial por consultas mensais paginadas. Ao crescer o volume de relatórios, criar agregações SQL/RPC por competência. Medir p95 no Supabase e Core Web Vitals na Vercel antes de aumentar limites.
