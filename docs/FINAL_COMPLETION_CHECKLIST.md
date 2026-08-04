# Checklist operacional de conclusão do Nummi

Atualizado durante a passagem final de engenharia iniciada em 4 de agosto de 2026.

## Legenda

- [x] concluído e comprovado
- [~] parcialmente concluído ou limitado pela infraestrutura
- [ ] pendente
- [!] depende de credencial, painel administrativo ou ação externa não disponível ao agente

## 1. Limpeza obrigatória antes do merge

- [ ] remover `scripts/vercel-quality-diagnostic.sh`
- [ ] restaurar `vercel.json` para o build normal
- [ ] remover chamadas temporárias de envio de logs
- [ ] remover tabela temporária de diagnósticos do Supabase
- [ ] remover Edge Functions temporárias de diagnóstico
- [ ] remover tokens e endpoints temporários
- [ ] remover extensão HTTP temporária se não for necessária
- [ ] procurar segredos e resíduos de diagnóstico na árvore atual
- [ ] revisar o diff final limpo

## 2. Sincronização API, banco e repositório

- [ ] sincronizar `supabase/functions/api-v1/index.ts` com a Edge Function v4
- [ ] sincronizar `http.ts`, `schemas.ts` e `deno.json`
- [ ] declarar a versão `1.2.1` consistentemente
- [ ] conferir migrations do GitHub contra o banco aplicado
- [ ] conferir OpenAPI contra rotas implantadas
- [ ] testar a API depois da sincronização

## 3. Testes reais de navegador

- [~] testes Playwright escritos para Chromium, desktop e Pixel 7
- [ ] executar login, cadastro e recuperação em navegador real
- [ ] executar confirmação e reenvio de e-mail
- [ ] executar temas claro e escuro
- [ ] executar dashboard, lançamentos, automações, orçamentos e configurações
- [ ] validar teclado, foco, modais, erros, estados vazios e loading
- [ ] validar resoluções pequenas, Pixel 7, zoom de 200% e overflow horizontal
- [ ] gerar screenshots, traces e relatório HTML

## 4. Configuração real de e-mail

- [x] fluxos e templates de confirmação, recuperação e troca de e-mail implementados
- [!] escolher e configurar provedor SMTP
- [!] verificar domínio e configurar SPF, DKIM e DMARC
- [!] testar Gmail, Outlook, spam, bounce e limites de envio
- [!] configurar remetente, validade de links e políticas de envio
- [ ] confirmar que mensagens não revelam existência da conta

## 5. Configuração do Supabase Auth

- [!] definir Site URL oficial e redirects permitidos
- [!] ativar proteção contra senhas vazadas
- [!] configurar CAPTCHA
- [!] revisar limites de cadastro, login e recuperação
- [!] revisar expiração de tokens, sessões e refresh tokens
- [x] confirmação obrigatória e alteração segura de e-mail contempladas no frontend
- [ ] revisar enumeração de usuários e estratégia futura de MFA

## 6. Usuários já criados

- [x] criar perfis ausentes e migrar preferências para tema escuro
- [!] reenviar e abrir confirmação de e-mail das contas existentes
- [!] confirmar links no domínio oficial
- [!] testar login após confirmação
- [ ] revisar e remover contas duplicadas ou de teste quando aplicável
- [ ] confirmar novamente isolamento entre usuários após o deploy final

## 7. CI do GitHub

- [ ] garantir `package-lock.json`
- [ ] usar `npm ci` determinístico
- [x] Node 22 definido no workflow
- [ ] estabilizar cache
- [x] lint, Vitest, TypeScript, build e bundle executados com sucesso na Vercel
- [ ] executar `npm audit` no CI
- [ ] executar smoke público da API no CI
- [ ] executar Playwright com dependências nativas
- [ ] publicar artefatos, cobertura, traces e screenshots
- [ ] exigir checks antes do merge e proteger `main`

## 8. Testes completos de autenticação

- [x] senha forte e confirmação de senha testadas unitariamente
- [~] cadastro, confirmação, reenvio e recuperação implementados
- [ ] validar cadastro válido, duplicado, inválido e senha fraca ponta a ponta
- [ ] validar links expirados, reutilizados e cooldown
- [ ] validar login antes e depois da confirmação
- [ ] validar troca de senha com senha antiga incorreta e correta
- [ ] validar troca de e-mail e confirmação do novo endereço
- [ ] validar sessões expiradas, múltiplas abas e múltiplos navegadores
- [ ] validar logout local, remoto e global

## 9. Testes hostis

- [x] RLS entre dois usuários validada para leitura, alteração, exclusão e falsificação de `user_id`
- [x] CORS permitido e origem hostil testados
- [x] JWT ausente e worker quebrado detectados e corrigidos
- [x] idempotência de recorrências testada
- [ ] ampliar brute force, credential stuffing e enumeração
- [ ] ampliar testes de redirects, replay, token expirado e sessão revogada
- [ ] testar sistematicamente JSON inválido, corpos vazios, payload grande e métodos indevidos
- [ ] testar limites, tipos errados, valores extremos, datas inválidas e concorrência
- [ ] testar todas as policies e RPCs para todos os recursos

## 10. QA manual tela por tela

- [~] revisão estática realizada e componentes separados por domínio
- [ ] login e cadastro
- [ ] dashboard
- [ ] lançamentos
- [ ] recorrências e assinaturas
- [ ] orçamentos
- [ ] configurações e conta
- [ ] mensagens, feedback, estados vazios e ações destrutivas

## 11. Acessibilidade

- [~] labels, foco visível, reduced motion e responsividade contemplados parcialmente
- [ ] auditar contraste WCAG
- [ ] auditar ordem de tabulação e uso sem mouse
- [ ] testar leitor de tela
- [ ] testar associação de erros aos campos
- [ ] testar foco em modais e retorno de foco
- [ ] revisar botões somente com ícone e alternativas textuais
- [ ] testar zoom de 200% e 400% e alto contraste

## 12. Desempenho

- [x] build de produção concluído
- [x] 1.718 módulos compilados
- [x] bundle JS total de 504.566 bytes dentro do orçamento
- [x] divisão por domínio e lazy loading implementados
- [ ] executar Lighthouse desktop e mobile
- [ ] medir Core Web Vitals, LCP, INP e CLS
- [ ] testar 10, 1.000 e 5.000 lançamentos
- [ ] medir login, snapshot, filtros, exportação e gráficos
- [ ] testar rede lenta, cache, retries e comportamento offline

## 13. Observabilidade e operação

- [x] `request_id` e logs estruturados básicos na API
- [ ] captura de erros do frontend
- [ ] alertas para 500, rate limit e falhas de e-mail
- [ ] métricas de resposta, login e banco
- [ ] política de retenção e sanitização de logs
- [ ] alertas de espaço, conexões e migrations
- [ ] política e teste de restauração de backup
- [ ] runbook de incidentes

## 14. Encerrar backend legado

- [x] frontend não depende mais do Apps Script
- [x] código legado removido da nova aplicação
- [!] exportar ou validar dados reais que ainda estejam nas planilhas
- [!] revogar e despublicar o Web App do Apps Script
- [!] apagar tokens e acessos antigos
- [!] definir retenção ou exclusão das planilhas
- [ ] confirmar que nenhuma URL ou variável antiga permanece no repositório

## 15. Remover sobras funcionais antigas

- [ ] buscar `investment`, `portfolio`, `wallet`, `goal`, `asset`
- [ ] buscar `patrimonio`, `patrimônio`, `carteira`, `investimento`, `meta`
- [ ] remover tipos, rotas, CSS, ícones, documentação e dados órfãos
- [ ] confirmar ausência de armazenamento legado e módulos fora do escopo

## 16. Revisão financeira

- [x] valores monetários positivos e limitados na API
- [x] previstos e realizados separados
- [x] recorrências de dias 29, 30 e 31 preservam o dia-base
- [x] idempotência evita duplicação na mesma janela
- [ ] ampliar testes de arredondamento e precisão de centavos
- [ ] revisar competência, virada de mês e fuso horário
- [ ] revisar categorias em uso e lançamentos gerados por recorrência
- [ ] revisar cancelamento, exportação, ordenação e concorrência

## 17. Documentação final

- [x] README, arquitetura, segurança, API e OpenAPI criados
- [x] autenticação, QA, desempenho, operação e auditoria do legado documentados
- [ ] revisar tudo depois da limpeza final
- [ ] documentar SMTP, Auth, CI, backup, rollback e incidentes com o estado final
- [ ] documentar limitações comprovadas sem marcar bloqueios como concluídos

## 18. Publicação final

- [ ] limpar a branch
- [ ] sincronizar API e banco
- [ ] executar novamente os gates disponíveis
- [ ] revisar advisors e dependências
- [ ] revisar e aprovar o PR #6
- [ ] mesclar por squash na `main`
- [ ] confirmar deploy de produção
- [ ] executar smoke tests pós-deploy
- [!] confirmar conta real, e-mail e recuperação com um endereço acessível ao proprietário
- [ ] alinhar branches remanescentes à `main`

## Resumo executivo

- [ ] instrumentação temporária removida
- [ ] API implantada sincronizada com GitHub
- [!] SMTP e Auth administrativo configurados
- [~] QA de navegador depende de ambiente compatível
- [ ] gates finais, merge e validação de produção concluídos
