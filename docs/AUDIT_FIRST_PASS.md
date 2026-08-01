# Nummi — Auditoria inicial de arquitetura, lógica, segurança e produto

Data: 2026-07-31

## Escopo desta passada

Esta é a primeira auditoria estrutural do estado atual do repositório. Ela registra achados confirmados no código inspecionado, riscos que exigem validação dinâmica e o plano de reconstrução. Não afirma cobertura integral de todas as linhas nem certificação de segurança: isso só será possível após a migração, testes automatizados, testes de integração, análise de dependências, inspeção visual e testes adversariais.

## Resumo executivo

O Nummi já possui uma interface funcional para controle financeiro, mas a arquitetura atual não é adequada para produção com dados financeiros pessoais. O aplicativo concentra grande parte da lógica em um componente React extenso, usa um backend próprio em Google Apps Script e implementa autenticação e sessões manualmente. A base precisa ser substituída por Supabase Auth, PostgreSQL com RLS e uma API explicitamente validada.

As áreas `Carteira`, investimentos, retornos de investimentos, `Metas` e qualquer conceito de patrimônio devem ser removidas. O produto deve ficar centrado em entradas, saídas, categorias, orçamentos, recorrências, assinaturas, contas futuras, notificações e relatórios.

## Achados críticos confirmados

### SEC-001 — Autenticação própria inadequada

O backend Apps Script implementa cadastro, login, senha, token e sessão por conta própria. Para uma aplicação financeira, isso aumenta drasticamente a superfície de ataque e duplica mecanismos que devem ser delegados a um provedor de identidade robusto.

**Correção:** substituir por Supabase Auth. Nenhuma senha deve ser processada ou armazenada pelo código da aplicação.

### SEC-002 — Política de senha extremamente fraca

O formulário atual aceita senha com apenas 3 caracteres (`minLength={3}`).

**Correção:** remover validação de senha artesanal e usar políticas do Supabase Auth. No frontend, usar no mínimo 8 caracteres como feedback de UX, sem tratar isso como única defesa.

### SEC-003 — Token e usuário persistidos em Web Storage

O frontend armazena usuário e token em `localStorage` ou `sessionStorage`. Qualquer XSS bem-sucedido pode ler esses valores. Também há migração silenciosa de chaves legadas.

**Correção:** usar o gerenciamento de sessão oficial do Supabase. Para SPA, minimizar código próprio de persistência, implementar CSP rigorosa e nunca persistir tokens paralelos criados pela aplicação.

### SEC-004 — Ausência de autorização no nível de linha comprovável

O Apps Script identifica usuários por parâmetros e tokens próprios e salva coleções em planilhas. Não há garantia equivalente a Row Level Security do PostgreSQL para impedir BOLA/IDOR em cada operação.

**Correção:** todas as tabelas expostas devem ter RLS habilitada e políticas de propriedade baseadas em `auth.uid() = user_id`, inclusive `USING` e `WITH CHECK` em atualizações.

### SEC-005 — Backend implantado como acesso público por link

A documentação interna do backend orienta publicar o Apps Script como Web App acessível por qualquer pessoa com o link. O segredo passa a ser a URL e a implementação própria de sessão.

**Correção:** remover completamente o Apps Script após migração. Não manter endpoint legado em produção.

### SEC-006 — Entrada CSV e gravação de coleções exigem endurecimento

O backend possui importação CSV e operações que salvam coleções inteiras. Isso cria riscos de abuso de recursos, mass assignment, campos inesperados, fórmulas perigosas em exportações CSV e sobrescrita acidental de dados.

**Correção:** validar cada payload com Zod, limitar tamanho, quantidade de registros e comprimento dos campos, rejeitar propriedades desconhecidas e neutralizar células iniciadas por `=`, `+`, `-` ou `@` nas exportações.

## Achados altos

### ARC-001 — `App.tsx` monolítico

Autenticação, navegação, gráficos, formulários, persistência, sincronização, notificações e regras financeiras estão concentrados no mesmo arquivo. Isso dificulta testes, revisão, acessibilidade, manutenção e otimização de renderização.

**Correção:** separar por recursos (`auth`, `transactions`, `recurrences`, `budgets`, `reports`, `settings`) e por camadas (`components`, `features`, `lib`, `schemas`, `services`).

### QA-001 — Sem testes automatizados

O `package.json` não possui scripts de teste, lint, cobertura, teste E2E, auditoria ou verificação de formatação.

**Correção:** adicionar Vitest, Testing Library, Playwright, ESLint, Prettier, `tsc --noEmit`, auditoria de dependências e pipeline CI.

### DEP-001 — Dependências com versões por faixa

As dependências usam `^`, permitindo alterações indiretas dentro da faixa sem revisão explícita.

**Correção:** manter lockfile versionado e usar atualização automatizada controlada. Para dependências críticas de autenticação e dados, revisar cada atualização.

### UX-001 — Texto sem acentuação e terminologia inconsistente

A interface contém rótulos como `Visao Geral`, `Transacoes`, `Orcamentos`, `Recorrencias` e `Relatorios`. Isso reduz acabamento e acessibilidade linguística.

**Correção:** padronizar PT-BR com acentuação correta, mensagens claras, estados vazios úteis e ajuda contextual.

### UX-002 — Navegação contém módulos fora do novo escopo

`Carteira` e `Metas` ainda fazem parte da navegação, com tipos e lógica associados a investimentos e objetivos.

**Correção:** remover completamente componentes, tipos, utilitários, armazenamento, rotas, relatórios e migrações relacionados.

### PERF-001 — Risco de renderizações e bundles desnecessários

O componente principal importa todas as telas, ícones e regras no mesmo módulo. Mesmo em uma aplicação pequena, isso impede divisão natural por rota e aumenta o custo de manutenção.

**Correção:** adotar lazy loading por tela quando houver benefício real, memoização apenas após medição e consultas paginadas no backend.

## Problemas de produto e lógica a revisar

1. Recorrência deve diferenciar previsão, lançamento efetivo e assinatura.
2. Uma recorrência não pode duplicar lançamentos ao reprocessar o mesmo período.
3. Alterar uma recorrência precisa oferecer: apenas próxima ocorrência, esta e futuras, ou toda a série.
4. Assinaturas precisam de dia de cobrança, periodicidade, próxima cobrança, status, histórico de preço e lembrete.
5. Parcelamentos precisam manter vínculo entre parcelas e impedir soma duplicada.
6. Transferências internas, se suportadas, não podem contar como receita ou despesa consolidada.
7. Exclusão deve preferir lixeira/soft delete e trilha de auditoria.
8. Valores monetários devem usar `numeric` no banco e nunca ponto flutuante binário como fonte de verdade.
9. Datas financeiras precisam separar data da competência, vencimento, pagamento e criação.
10. Filtros e relatórios devem usar o fuso horário definido pelo usuário.

## Escopo funcional aprovado

### Permanecem

- Entradas e saídas
- Categorias e subcategorias
- Orçamentos mensais
- Recorrências
- Assinaturas
- Contas previstas, vencidas, pagas e canceladas
- Parcelamentos
- Notificações
- Importação e exportação
- Relatórios e comparações mensais
- Configurações do usuário
- Auditoria de alterações

### Devem ser removidos

- Patrimônio
- Carteira
- Investimentos
- Retornos de investimentos
- Metas financeiras

## Arquitetura alvo

- React + TypeScript + Vite
- Supabase Auth
- PostgreSQL/Supabase
- RLS em todas as tabelas expostas
- Schemas privados para funções internas e auditoria
- Zod para entrada e saída da API
- API versionada em `/api/v1`
- OpenAPI gerado e versionado
- Rate limiting por usuário e IP nas rotas sensíveis
- Logs estruturados sem dados financeiros sensíveis
- Testes unitários, integração, RLS, E2E e adversariais
- CI obrigatória antes de merge

## Critérios de bloqueio para merge em `main`

Nenhuma migração principal deve ser mesclada enquanto houver:

- tabela exposta sem RLS;
- política que permita acesso entre usuários;
- segredo ou `service_role` no frontend;
- endpoint sem validação de schema;
- falha em testes de isolamento multiusuário;
- dependência crítica vulnerável sem mitigação;
- build, typecheck, lint ou testes falhando;
- migração destrutiva sem backup e plano de rollback.

## Próximas etapas técnicas

1. Criar requisitos e modelo de dados.
2. Remover módulos fora de escopo.
3. Introduzir testes e CI antes da migração funcional.
4. Criar migrations Supabase com RLS e testes de isolamento.
5. Substituir autenticação e persistência do Apps Script.
6. Implementar API versionada com Zod e OpenAPI.
7. Executar QA visual, acessibilidade e E2E.
8. Executar testes adversariais autorizados em ambiente de teste.
9. Somente então desativar Apps Script e promover a nova arquitetura.
