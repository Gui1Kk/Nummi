# Checklist operacional de conclusão do Nummi

Última atualização: 4 de agosto de 2026, após merge e deploy da `main`.

## Legenda

- [x] concluído e comprovado
- [~] parcialmente concluído ou bloqueado pela infraestrutura
- [ ] ainda pendente
- [!] depende de painel, credencial, provedor ou ação externa do proprietário

## Evidências da release

- [x] PR #6 mesclado por squash na `main`
- [x] commit de release: `01ea1264c7eae98bf4a479acc9186fa015c3fb5f`
- [x] deploy de produção da Vercel concluído com sucesso
- [x] gate `npm run check` executado pela Vercel
- [x] API `1.2.1`, Edge Function Supabase v5, ativa com JWT obrigatório
- [x] todas as branches secundárias alinhadas ao commit da `main` após o merge
- [x] Security e Performance Advisors revisados
- [~] GitHub Actions continua encerrando jobs antes do checkout, com zero steps

## 1. Limpeza e sincronização

- [x] remover script e chamadas de diagnóstico da Vercel
- [x] remover tabelas temporárias de diagnóstico
- [x] remover extensão temporária `http`
- [x] aposentar funções `build-diagnostics` e `api-load-test` com JWT e resposta 410
- [x] versionar a migration de limpeza
- [x] sincronizar `index.ts`, `http.ts`, `schemas.ts` e `deno.json`
- [x] reimplantar a API a partir do código do repositório
- [x] sincronizar OpenAPI e versão `1.2.1`
- [x] remover referências funcionais a patrimônio, carteira, investimentos e metas

## 2. Autenticação e conta

- [x] confirmação de senha no cadastro
- [x] política de senha forte
- [x] normalização e validação local do e-mail
- [x] confirmação e reenvio com cooldown
- [x] recuperação de senha e tela `PASSWORD_RECOVERY`
- [x] tratamento de links expirados, inválidos e reutilizados
- [x] alteração de perfil, e-mail e senha
- [x] validação da senha atual antes da troca
- [x] logout local, de outros dispositivos e global
- [x] correção dos perfis e ajustes ausentes
- [x] tema escuro neon como padrão e tema claro alternativo
- [!] corrigir no painel a Site URL e os redirects, atualmente com evidência de retorno para `http://localhost:3000`
- [!] reenviar confirmação aos dois usuários ainda pendentes depois da correção dos redirects
- [!] validar login e recuperação reais no domínio oficial

## 3. E-mail e proteção administrativa

- [x] templates de confirmação, recuperação e troca de e-mail
- [x] resposta de recuperação sem enumeração explícita de contas
- [x] logs confirmaram envio pelo mailer padrão do Supabase
- [!] configurar SMTP de produção
- [!] verificar domínio, SPF, DKIM e DMARC
- [!] testar Gmail, Outlook, spam, bounce e limites
- [!] ativar Leaked Password Protection
- [!] configurar CAPTCHA
- [!] revisar limites, expiração de tokens, sessões e refresh tokens
- [ ] decidir estratégia futura de MFA

## 4. Frontend e experiência

- [x] `App.tsx` transformado em orquestrador
- [x] telas separadas por domínio e carregadas sob demanda
- [x] lançamentos pesquisáveis, filtráveis, editáveis e removíveis
- [x] recorrências e assinaturas editáveis, pausáveis e idempotentes
- [x] orçamentos editáveis e com indicação de excesso
- [x] categorias editáveis, arquiváveis, restauráveis e removíveis quando possível
- [x] exportação CSV mensal
- [x] feedback de loading, sucesso, erro e ações destrutivas
- [x] rollback visual quando a troca de tema não salva
- [x] Error Boundary contra tela branca
- [x] tratamento online/offline
- [~] QA estático concluído
- [ ] QA humano completo em navegador nas telas autenticadas

## 5. API e segurança

- [x] JWT obrigatório
- [x] autorização por usuário na API e RLS no banco
- [x] isolamento entre dois usuários testado
- [x] Zod estrito e rejeição de campos inesperados
- [x] UUIDs, datas e valores validados
- [x] payload máximo de 1 MB
- [x] paginação e offsets limitados
- [x] importação limitada a 500 linhas
- [x] exportação e resumo limitados a 10.000 linhas
- [x] resumo recusa total potencialmente truncado
- [x] rate limiting por usuário e rota
- [x] idempotência de transações e recorrências
- [x] proteção contra CSV Formula Injection
- [x] CORS oficial 204 e origem hostil 403
- [x] chamada sem JWT 401
- [x] erros sem SQL, stack ou segredos
- [x] `request_id` para correlação
- [~] tabelas privadas não possuem grants de cliente; RLS adicional está documentado para validação deliberada em staging
- [ ] fuzzing autenticado amplo e teste de carga concorrente representativo

## 6. Regras financeiras

- [x] entradas e saídas separadas
- [x] previsto e realizado separados
- [x] aritmética monetária em centavos inteiros
- [x] teste de drift `0.1 + 0.2`
- [x] recorrências dos dias 29, 30 e 31 preservam o dia-base
- [x] fevereiro e ano bissexto cobertos
- [x] repetição da mesma janela não duplica lançamentos
- [x] categorias cruzadas entre usuários bloqueadas
- [x] categoria em uso retorna conflito
- [x] exportação respeita o intervalo
- [~] fuso configurável implementado, ainda exigindo QA nas viradas de dia e mês
- [ ] teste concorrente amplo entre automação e criação manual

## 7. Testes e CI

- [x] testes unitários de senha, e-mail, schemas, recorrência e dinheiro
- [x] lint com zero warnings
- [x] TypeScript estrito
- [x] build de produção
- [x] orçamento de bundle
- [x] smoke hostil da API integrado ao gate da Vercel
- [x] Playwright escrito para desktop e mobile
- [x] workflow preparado para traces, screenshots e relatório
- [~] Vercel não iniciou Chromium por ausência de `libnspr4.so`
- [~] GitHub Actions não inicia nem o checkout por bloqueio administrativo
- [!] corrigir habilitação, cobrança ou política do GitHub Actions
- [ ] gerar e revisar `package-lock.json` em ambiente com acesso ao registro público
- [ ] migrar para `npm ci`
- [ ] executar Playwright em runner funcional

## 8. Acessibilidade e visual

- [x] tema escuro neon padrão
- [x] tema claro aurora
- [x] labels e nomes acessíveis nas telas principais
- [x] foco visível
- [x] `prefers-reduced-motion`
- [x] botões críticos de ícone com `aria-label`
- [x] gráficos com descrição textual básica
- [~] contraste e responsividade revisados estaticamente
- [ ] auditoria WCAG em navegador
- [ ] leitor de tela, zoom 200% e 400%, alto contraste e foco de modais
- [ ] screenshots e traces reais de desktop e mobile

## 9. Desempenho

- [x] lazy loading e chunks por domínio
- [x] snapshot limitado e consultas paralelas
- [x] bundle medido em aproximadamente 505 KB antes dos ajustes finais, dentro do orçamento
- [x] maior chunk abaixo do limite individual
- [x] índices de consulta e integridade preservados
- [x] decisão de não remover índices sem carga representativa documentada
- [ ] Lighthouse e Core Web Vitals
- [ ] testes com 1.000 e 5.000 lançamentos
- [ ] p95/p99 e `EXPLAIN (ANALYZE, BUFFERS)` com dados representativos

## 10. Observabilidade e operação

- [x] logs estruturados básicos e `request_id`
- [x] Error Boundary no frontend
- [x] runbook de login, API 500, dados, recorrências e desempenho
- [x] rollback de frontend, Edge Function e banco
- [x] política e roteiro de teste de restauração de backup
- [ ] serviço externo de captura de erros do frontend
- [ ] alertas para 500, 429, e-mail, espaço e conexões
- [ ] teste real de restauração

## 11. Backend legado e dados antigos

- [x] frontend não depende mais de Google Apps Script
- [x] backend e armazenamento legados removidos da aplicação atual
- [x] árvore atual sem módulos de patrimônio, carteira, investimentos ou metas
- [!] exportar ou validar qualquer dado real ainda mantido em planilhas
- [!] despublicar o Web App do Apps Script
- [!] revogar tokens e acessos antigos
- [!] definir retenção ou exclusão das planilhas

## 12. Publicação e branches

- [x] PR #6 revisado e mesclado por squash
- [x] `main` implantada com sucesso
- [x] smoke público executado pelo gate pós-merge
- [x] API e frontend permanecem sincronizados
- [x] branches secundárias apontam para o mesmo commit da `main`
- [~] refs secundárias não foram apagadas porque o conector não oferece exclusão física
- [!] concluir configuração administrativa do Supabase Auth e SMTP
- [!] validar uma conta real no domínio oficial

## Resumo executivo

### Concluído pelo agente

- [x] limpeza, refatoração, API, banco, segurança, documentação, testes disponíveis, merge e deploy
- [x] checklist mantido como fonte de verdade
- [x] branches sem divergência funcional

### Ainda depende de infraestrutura ou acesso externo

- [!] Site URL e redirects do Auth
- [!] SMTP, DNS de e-mail, CAPTCHA e senhas vazadas
- [!] GitHub Actions operacional
- [ ] Playwright e QA visual real
- [ ] lockfile determinístico
- [!] desativação definitiva do Apps Script e decisão sobre planilhas antigas
