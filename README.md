# Nummi

Plataforma financeira pessoal para registrar **entradas, saídas, orçamentos, recorrências e assinaturas**. O Nummi substitui controles dispersos em planilhas por um fluxo mensal simples, auditável e protegido por isolamento de dados no banco.

> Patrimônio, carteira, investimentos e metas não fazem parte do escopo atual.

## Recursos

- entradas e saídas realizadas ou planejadas;
- categorias próprias;
- recorrências diárias, semanais, mensais e anuais;
- assinaturas mensais e anuais com próximo vencimento;
- geração idempotente de ocorrências;
- orçamentos mensais por categoria;
- relatórios por competência;
- importação e exportação CSV com proteção contra fórmulas maliciosas;
- autenticação pelo Supabase Auth;
- Row Level Security em todas as tabelas privadas;
- API REST versionada em Supabase Edge Functions.

## Stack

- React 18, TypeScript estrito e Vite;
- Supabase Auth, PostgreSQL 17, RLS e Edge Functions;
- Zod para validação na interface e na API;
- Vitest e Playwright;
- Vercel para frontend e GitHub Actions para CI.

## Desenvolvimento

```bash
npm install
cp .env.example .env.local
npm run dev
```

Variáveis:

```env
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
VITE_API_URL=https://SEU_PROJETO.supabase.co/functions/v1/api-v1/v1
```

A chave publicável pode existir no navegador. A segurança depende de RLS e grants. Nunca use `service_role` ou secret key no frontend.

## Verificações

```bash
npm run lint
npm test
npm run build
npm run test:e2e
```

## Banco e API

Consulte:

- [Arquitetura](docs/ARCHITECTURE.md)
- [Modelo financeiro](docs/FINANCIAL_RULES.md)
- [Segurança](docs/SECURITY.md)
- [API](docs/API.md)
- [Migração do Apps Script](docs/MIGRATION.md)
- [Operação e deploy](docs/OPERATIONS.md)

As migrations ficam em `supabase/migrations`. A Edge Function está em `supabase/functions/api-v1`.

## Estado de segurança

O schema de produção foi verificado pelo Supabase Security Advisor sem alertas após a correção das funções privilegiadas. Isso não significa segurança absoluta: mudanças futuras exigem novamente testes de RLS, revisão de dependências, CI e análise dos advisors.
