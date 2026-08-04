# Nummi

Plataforma financeira pessoal para controlar **entradas, saídas, lançamentos previstos, recorrências, assinaturas e orçamentos mensais**. O produto não possui patrimônio, carteira, investimentos ou metas.

## Recursos

- cadastro com confirmação de e-mail e senha forte;
- reenvio de confirmação e recuperação de conta;
- alteração autenticada de perfil, e-mail e senha;
- encerramento de sessão local, remota ou global;
- lançamentos realizados e previstos com edição, filtros e pesquisa;
- recorrências e assinaturas editáveis, pausáveis e idempotentes;
- orçamentos mensais por categoria;
- relatório mensal e exportação CSV segura;
- tema escuro neon como padrão e tema claro aurora;
- modo de privacidade e densidade compacta;
- Supabase Auth, PostgreSQL, RLS e Edge Function versionada.

## Desenvolvimento

O repositório ainda não possui `package-lock.json`, portanto use `npm install` até que o lockfile seja gerado e revisado em um ambiente com acesso ao registro público.

```bash
npm install --ignore-scripts --no-audit --no-fund
cp .env.example .env.local
npm run dev
```

```env
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
VITE_API_URL=https://SEU_PROJETO.supabase.co/functions/v1/api-v1/v1
```

A chave publicável pode estar no navegador. Nunca coloque `service_role`, secret key ou credenciais SMTP no frontend.

## Qualidade

O deploy da Vercel executa `npm run check`, que combina lint, testes unitários, TypeScript, build de produção e orçamento de bundle.

```bash
npm run check
npm run test:api-public
npm run test:e2e
```

O GitHub Actions também contém esses gates e o Playwright, mas o executor da conta precisa estar operacional para iniciar os jobs.

## Documentação

- [Arquitetura](docs/ARCHITECTURE.md)
- [API](docs/API.md)
- [OpenAPI](docs/openapi.yaml)
- [Autenticação e e-mail](docs/AUTH_EMAIL_SETUP.md)
- [Segurança](docs/SECURITY.md)
- [Auditoria completa do legado](docs/LEGACY_AUDIT_COMPLETE.md)
- [Matriz de QA](docs/QA_MATRIX.md)
- [Desempenho](docs/PERFORMANCE.md)
- [Regras financeiras](docs/FINANCIAL_RULES.md)
- [Operação](docs/OPERATIONS.md)
- [Checklist de conclusão](docs/FINAL_COMPLETION_CHECKLIST.md)

## Configuração externa necessária

O código de confirmação e recuperação está implementado. Para envio confiável a qualquer usuário, configure um SMTP de produção no painel Supabase, além de Site URL, redirects autorizados, CAPTCHA e proteção contra senhas vazadas. Essas opções exigem credenciais administrativas e um provedor externo, portanto não ficam no repositório.
