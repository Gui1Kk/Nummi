# Checklist operacional de conclusão do Nummi

Última revalidação: 4 de agosto de 2026, após auditoria da `main`, do Supabase implantado, dos advisors, dos logs de Auth, dos testes e dos gates de deploy.

## Legenda

- [x] concluído e comprovado no estado atual
- [~] parcialmente concluído, implementado sem validação ponta a ponta ou limitado pela infraestrutura
- [ ] pendente de engenharia ou validação
- [!] depende de painel administrativo, credencial, provedor ou ação externa do proprietário

## Evidências atuais

- [x] PR #6 mesclado e aplicação implantada na Vercel
- [x] commit anterior a esta revalidação: `76a05e510c99bad27ff5823cd58fc591d5ae9686`
- [x] Vercel verde executando `npm run check`
- [x] API `1.2.1`, Edge Function `api-v1` versão 5, ativa com `verify_jwt=true`
- [~] Edge Functions temporárias `build-diagnostics` e `api-load-test` continuam existentes, porém exigem JWT e retornam somente `410 Gone`
- [x] extensão temporária `http` não está instalada
- [x] Security Advisor sem alerta de RLS; único aviso atual é Leaked Password Protection desativada
- [~] Performance Advisor informa índices ainda não utilizados porque não existe carga financeira representativa
- [~] GitHub Actions run 59 encerrou os dois jobs antes de qualquer step
- [~] Auth possui 3 usuários: 1 confirmado, 2 não confirmados e nenhum login concluído
- [!] existem 0 perfis para os 3 usuários atuais; ajustes e categorias existem
- [~] produção possui 13 migrations aplicadas, mas o repositório ainda não materializa integralmente o schema inicial
- [~] não existem transações, recorrências, assinaturas ou orçamentos reais para validar comportamento em carga

## 1. Limpeza obrigatória antes do merge

- [x] remover scripts e chamadas temporárias de diagnóstico da Vercel
- [x] restaurar `vercel.json` para o gate permanente `npm run check`
- [x] remover tabelas temporárias de diagnóstico
- [x] remover extensão temporária `http`
- [x] remover tokens e endpoints temporários do código versionado
- [x] versionar migration de limpeza
- [x] aposentar `build-diagnostics` e `api-load-test` com JWT e resposta `410 Gone`
- [ ] excluir fisicamente as duas Edge Functions temporárias pelo painel ou ferramenta que suporte exclusão
- [x] revisar a árvore atual sem módulos funcionais de patrimônio, carteira, investimentos ou metas

## 2. Sincronização API, banco e repositório

- [x] manter API, frontend e OpenAPI na versão declarada `1.2.1`
- [x] manter `index.ts`, `http.ts`, `schemas.ts` e `deno.json` no repositório
- [x] manter a Edge Function principal na versão 5 com JWT obrigatório
- [x] versionar as migrations recentes de Auth, índices compostos e limpeza temporária
- [ ] executar `supabase db pull` e materializar o schema inicial completo no repositório
- [ ] versionar as migrations de produção ausentes: schema central, rate limit, índices, idempotência, helpers de recorrência, FKs compostas e RPCs
- [ ] reconciliar os nomes/versões dos SQLs versionados com as 13 migrations registradas em produção
- [ ] validar reconstrução integral do banco em um projeto Supabase vazio somente a partir do repositório
- [ ] completar o OpenAPI com propriedades e regras de `RecurrenceInput`, `SubscriptionInput`, `BudgetInput`, `ProfilePatch` e `SettingsPatch`
- [ ] adicionar request bodies de PATCH atualmente ausentes para recorrências, assinaturas e orçamentos

## 3. Testes reais de navegador

- [x] manter Playwright configurado para Chromium desktop e mobile
- [x] manter testes da entrada pública, tema escuro, campos de cadastro, recuperação e overflow mobile
- [x] manter workflow preparado para screenshots, traces e relatório HTML
- [~] Vercel não conseguiu iniciar Chromium por ausência de `libnspr4.so`
- [~] GitHub Actions não inicia o checkout por bloqueio administrativo do runner
- [ ] executar a suíte Playwright em runner funcional
- [ ] adicionar e executar fluxos autenticados de dashboard, lançamentos, recorrências, assinaturas, orçamentos, relatórios e conta
- [ ] gerar e revisar screenshots, traces, vídeos de falha e relatório HTML
- [ ] validar desktop, Pixel 7, telas menores, zoom 200%/400% e ausência de overflow

## 4. Configuração real de e-mail

- [x] implementar cadastro, confirmação, reenvio, recuperação e troca de e-mail
- [x] criar templates HTML de confirmação, recuperação e alteração de endereço
- [x] usar mensagem de recuperação que não confirma explicitamente a existência da conta
- [x] confirmar pelos logs que o mailer padrão do Supabase enviou uma mensagem
- [!] escolher e configurar provedor SMTP de produção
- [!] configurar remetente e verificar domínio
- [!] configurar SPF, DKIM e DMARC
- [!] testar Gmail, Outlook, spam, bounce, rejeição e limites de envio
- [!] revisar validade dos links, cooldowns e políticas de envio no painel

## 5. Configuração do Supabase Auth

- [!] definir a Site URL oficial de produção
- [!] autorizar o domínio oficial da Vercel e previews necessários
- [!] remover `http://localhost:3000` se essa porta não for mais utilizada
- [!] manter apenas redirects locais realmente necessários, preferencialmente Vite em `localhost:5173`
- [!] ativar Leaked Password Protection
- [!] configurar CAPTCHA no cadastro e na recuperação
- [!] revisar limites de cadastro, login, reenvio e recuperação
- [!] revisar expiração de access token, refresh token e sessões
- [!] revisar política de reutilização de refresh token e alteração segura de e-mail
- [ ] decidir se MFA fará parte do produto e documentar a decisão

## 6. Usuários já criados

- [x] manter 3 linhas de ajustes e 33 categorias padrão
- [ ] recriar/backfill os perfis ausentes dos 3 usuários atuais
- [ ] descobrir por que os perfis anteriormente criados deixaram de existir
- [!] reenviar confirmação aos 2 usuários não confirmados depois de corrigir Site URL e redirects
- [!] testar login da conta confirmada no domínio oficial
- [!] testar recuperação, alteração de e-mail e troca de senha com uma conta real
- [ ] revisar e remover contas duplicadas ou exclusivamente de teste
- [ ] confirmar novamente o isolamento entre usuários depois do backfill e do primeiro login real

## 7. CI do GitHub

- [x] manter workflow com Node 22 e permissões somente de leitura
- [x] manter lint, Vitest, TypeScript, build, bundle e smoke público da API no job de qualidade
- [x] manter Playwright e upload de artefatos no job de navegador
- [~] run 59 falhou com zero steps em ambos os jobs, antes do checkout
- [!] corrigir habilitação, cobrança, política ou disponibilidade dos runners do GitHub Actions
- [ ] gerar e revisar `package-lock.json` em ambiente com acesso ao registro npm
- [ ] substituir `npm install` por `npm ci`
- [ ] habilitar cache determinístico depois do lockfile
- [ ] executar `npm audit` em runner funcional e registrar o resultado
- [!] configurar proteção da `main` e checks obrigatórios quando Actions estiver operacional

## 8. Testes completos de autenticação

- [x] testar unitariamente normalização e validação de e-mail
- [x] testar unitariamente política de senha e confirmação
- [x] tratar `email_not_confirmed`, credenciais inválidas, rate limit e links expirados/reutilizados
- [x] validar a senha atual antes de alterar a senha
- [~] Playwright apenas comprova descoberta visual dos fluxos públicos
- [ ] testar ponta a ponta cadastro válido, duplicado, e-mail inválido e senha fraca
- [ ] testar login antes e depois da confirmação
- [ ] testar reenvio dentro e depois do cooldown
- [ ] testar link expirado, link reutilizado e redirect não permitido
- [ ] testar recuperação completa e troca de senha com senha atual correta/incorreta
- [ ] testar alteração e confirmação do novo e-mail
- [ ] testar logout local, de outros dispositivos e global
- [ ] testar múltiplas abas, navegadores, refresh token expirado e sessão revogada

## 9. Testes hostis

- [x] manter evidência anterior de RLS entre dois usuários para SELECT, UPDATE, DELETE e `user_id` falsificado
- [x] manter smoke público de JWT ausente e origem hostil
- [x] manter validação estrita, limites de payload, paginação, offset, importação e exportação
- [x] manter proteção contra CSV Formula Injection e idempotência
- [ ] repetir a matriz RLS depois do backfill dos perfis e com usuários confirmados
- [ ] testar todas as policies e RPCs para categorias, transações, recorrências, assinaturas, orçamentos e notificações
- [ ] executar fuzzing autenticado de JSON inválido, corpo vazio, tipos errados, UUIDs inválidos, métodos indevidos e campos extras
- [ ] testar payloads no limite e acima do limite
- [ ] testar replay de token, sessão expirada, token revogado e redirects manipulados
- [ ] testar brute force e credential stuffing depois de CAPTCHA/rate limits administrativos
- [ ] testar concorrência e repetição simultânea de `Idempotency-Key`

## 10. QA manual tela por tela

- [x] revisar estaticamente login, cadastro, recuperação, dashboard, lançamentos, automações, orçamentos, relatórios, conta e ajuda
- [x] manter feedback de loading, sucesso, erro, estados vazios e confirmações destrutivas
- [ ] executar QA humano completo em navegador com uma conta real
- [ ] validar textos longos, valores extremos, datas antigas/futuras e listas vazias/grandes
- [ ] aplicar efetivamente `profile.currency` e `profile.locale` à formatação de valores e datas
- [ ] aplicar efetivamente `profile.timezone` às datas atuais e viradas de competência
- [ ] expor ou remover `week_starts_on` e `reminder_days` globais, hoje persistidos sem controle na interface
- [ ] permitir configurar `end_date` e observação de recorrências
- [ ] permitir configurar intervalo, `end_date` e observação de assinaturas
- [ ] exibir/usar o site salvo da assinatura
- [ ] revisar todos os botões de editar, pausar e excluir nas listas de automações

## 11. Acessibilidade

- [x] manter labels nas telas principais, foco visível e `prefers-reduced-motion`
- [x] manter Error Boundary com recuperação sem tela branca
- [~] contraste e responsividade foram revisados apenas estaticamente
- [ ] executar auditoria automatizada WCAG/axe em navegador
- [ ] testar navegação completa somente por teclado
- [ ] testar leitor de tela
- [ ] testar zoom 200% e 400%, alto contraste e reflow
- [ ] validar foco inicial, foco preso e retorno de foco em diálogos/confirmações
- [ ] adicionar nomes acessíveis aos botões de editar/excluir recorrências e assinaturas e ao pause/play de assinaturas
- [ ] revisar alternativas textuais para métricas, barras e informações comunicadas por cor

## 12. Desempenho

- [x] manter lazy loading por domínio
- [x] manter orçamento de bundle e gate de build na Vercel
- [x] manter snapshot com limites e consultas paralelas
- [x] preservar índices até existir carga representativa
- [ ] executar Lighthouse desktop e mobile
- [ ] medir Core Web Vitals: LCP, INP e CLS
- [ ] testar frontend e API com 1.000 e 5.000 lançamentos por usuário
- [ ] medir tempo de login, snapshot, filtros, relatórios e exportação
- [ ] medir p50, p95 e p99 da API
- [ ] executar `EXPLAIN (ANALYZE, BUFFERS)` com dados representativos
- [ ] migrar a tela inicial para consultas mensais paginadas antes de ultrapassar o limite do snapshot
- [ ] testar rede lenta, retries, cache e reconexão offline

## 13. Observabilidade e operação

- [x] manter `request_id`, logs estruturados básicos e Error Boundary
- [x] manter runbook de login, API 500, RLS, recorrências e desempenho
- [x] manter procedimentos documentados de rollback e restauração
- [ ] integrar serviço externo de captura de erros do frontend
- [ ] configurar alertas automáticos para HTTP 500, 429 e falhas de e-mail
- [ ] configurar alertas de banco para espaço, conexões e falhas de migration
- [ ] definir retenção e sanitização de logs
- [ ] monitorar falhas de Auth e entregabilidade SMTP
- [ ] executar um teste real de restauração de backup
- [ ] criar observabilidade para automações vencidas e ocorrências não processadas

## 14. Encerrar backend legado

- [x] manter frontend e API atuais independentes do Google Apps Script
- [x] manter código Apps Script fora da aplicação atual
- [!] exportar ou validar dados reais ainda existentes nas planilhas
- [!] bloquear novas escritas no backend legado
- [!] despublicar o Web App do Apps Script
- [!] revogar tokens, acessos e permissões antigos
- [!] definir política de retenção, arquivamento ou exclusão das planilhas
- [!] confirmar que nenhum usuário continua utilizando a versão antiga

## 15. Remover sobras funcionais antigas

- [x] tipos atuais sem patrimônio, carteira, investimentos, ativos ou metas
- [x] navegação atual restrita a visão geral, lançamentos, recorrências, orçamentos, relatórios, conta e ajuda
- [x] API atual sem endpoints de patrimônio, investimento ou meta
- [x] árvore funcional atual sem armazenamento ou componentes desses módulos
- [x] manter referências históricas apenas em documentação de auditoria e histórico Git

## 16. Revisão financeira

- [x] manter valores positivos, finitos e limitados
- [x] manter previsto e realizado separados
- [x] manter aritmética em centavos no frontend e testes de `0.1 + 0.2`
- [x] manter recorrências dos dias 29, 30 e 31 e ano bissexto testados
- [x] manter idempotência e FKs compostas por usuário
- [ ] substituir as somas com `Number` do endpoint `/summary` por agregação SQL/numeric ou centavos inteiros
- [ ] implementar de verdade o rollover de orçamento ou remover a opção “Carregar saldo não usado”
- [ ] aplicar moeda, locale e fuso configurados aos cálculos e apresentações
- [ ] implementar entrega de lembretes de assinatura; `reminder_days` hoje é apenas armazenado
- [ ] implementar scheduler/background job para recorrências; hoje o processamento ocorre apenas no login ou atualização manual
- [ ] definir o comportamento ao editar/excluir lançamento gerado por recorrência ou assinatura
- [ ] testar virada de dia/mês em múltiplos fusos
- [ ] testar concorrência entre automação e criação manual
- [ ] validar relatórios e arredondamentos com dados financeiros reais

## 17. Documentação final

- [x] manter README, arquitetura, segurança, API, Auth, QA, desempenho, operação e auditoria do legado
- [x] restaurar este checklist para as 18 seções originais
- [x] documentar bloqueios externos sem marcá-los como concluídos
- [ ] materializar e documentar o schema inicial completo do Supabase
- [ ] completar os schemas e request bodies do OpenAPI
- [ ] documentar explicitamente que não existe scheduler de automações em background
- [ ] documentar que lembretes e rollover ainda não possuem execução funcional
- [ ] atualizar a documentação de usuários para refletir os 3 perfis ausentes
- [ ] atualizar a documentação depois da configuração final de SMTP/Auth e do QA real

## 18. Publicação final

- [x] PR #6 mesclado por squash
- [x] aplicação implantada na Vercel
- [x] API v5 ativa e protegida por JWT
- [x] gate da Vercel verde no commit anterior a esta atualização documental
- [x] branches secundárias estavam alinhadas antes desta atualização do checklist
- [ ] confirmar o deploy da Vercel deste commit de checklist restaurado
- [ ] realinhar branches secundárias ao novo commit da `main`
- [ ] executar smoke autenticado pós-deploy quando Auth/redirects estiverem corrigidos
- [!] concluir Site URL, redirects, SMTP, CAPTCHA e Leaked Password Protection
- [!] validar cadastro, confirmação, login e recuperação no domínio oficial
- [ ] excluir fisicamente as funções temporárias aposentadas
- [ ] considerar a release pronta para abertura pública somente após os bloqueios de Auth, e-mail e QA real

## Resumo executivo

### Concluído

- refatoração principal, CRUD financeiro, autenticação no código, API protegida, RLS, deploy, documentação-base e gates disponíveis

### Bloqueios mais importantes

1. Site URL/redirects, SMTP, CAPTCHA e Leaked Password Protection
2. 3 perfis ausentes, 2 usuários não confirmados e nenhum login real concluído
3. schema inicial/migrations ainda não totalmente versionados
4. GitHub Actions e Playwright sem runner funcional
5. configurações de moeda/locale/fuso sem efeito, rollover e lembretes sem execução
6. recorrências sem scheduler em background
7. QA, acessibilidade, desempenho e testes hostis autenticados ainda incompletos
