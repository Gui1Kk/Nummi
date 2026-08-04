# Checklist operacional de conclusão do Nummi

Última atualização: 4 de agosto de 2026.

## Legenda

- [x] concluído e comprovado
- [~] parcialmente concluído ou limitado pela infraestrutura
- [ ] pendente
- [!] depende de credencial, painel administrativo ou ação externa não disponível ao agente

## Evidências principais desta passagem

- PR #6 permanece aberto e mergeável enquanto os bloqueios externos são avaliados;
- Vercel executou com sucesso `npm run check` no commit que incluiu lint, testes, TypeScript, build, bundle e smoke público da API;
- API `api-v1` versão `1.2.1`, deployment Supabase v5, está ativa com JWT obrigatório;
- Security Advisor: somente `Leaked Password Protection` desativado;
- Performance Advisor: índices ainda sem uso por ausência de carga representativa, sem recomendação de remoção antecipada;
- Auth: 3 usuários, 1 confirmado, 2 não confirmados e nenhum login concluído registrado;
- dados atuais: 3 perfis, 3 ajustes, 33 categorias e nenhuma transação/recorrência/assinatura/orçamento;
- GitHub Actions continua falhando antes do checkout, com zero steps, mesmo após simplificação completa do workflow.

## 1. Limpeza obrigatória antes do merge

- [x] remover `scripts/vercel-quality-diagnostic.sh`
- [x] restaurar `vercel.json` para um gate permanente e não diagnóstico
- [x] remover chamadas temporárias de envio de logs
- [x] remover `public.build_diagnostics_temp`
- [x] remover `private.build_diagnostics`
- [x] aposentar `build-diagnostics` com JWT obrigatório e resposta 410
- [x] aposentar `api-load-test` com JWT obrigatório e resposta 410
- [x] remover extensão temporária `http`
- [x] versionar a migration de limpeza
- [x] remover token e endpoint temporários da árvore atual
- [x] revisar a árvore alterada depois da limpeza

Observação: o conector não oferece exclusão física de Edge Functions. As duas funções temporárias foram neutralizadas, exigem JWT e não executam mais diagnóstico ou carga.

## 2. Sincronização API, banco e repositório

- [x] sincronizar `index.ts` com a Edge Function implantada
- [x] sincronizar `http.ts`, `schemas.ts` e `deno.json`
- [x] declarar versão `1.2.1` no código e OpenAPI
- [x] reimplantar a API a partir do código versionado
- [x] limitar resumo a 10.000 linhas sem retornar total parcial
- [x] conferir migrations aplicadas e versionar a limpeza final
- [~] baseline completo anterior continua representado pelo histórico de migrations do projeto, mas não por um único dump reproduzível no repositório
- [x] conferir OpenAPI contra as rotas atuais
- [x] testar JWT ausente, CORS permitido/hostil e funções aposentadas

## 3. Testes reais de navegador

- [x] testes Playwright escritos para Chromium desktop e mobile
- [x] workflow preparado para instalar dependências nativas e publicar traces/screenshots
- [~] Vercel tentou executar Chromium, mas a imagem não forneceu `libnspr4.so`
- [~] GitHub Actions não iniciou qualquer step por bloqueio administrativo do executor
- [ ] executar toda a suíte Playwright em runner funcional
- [ ] gerar screenshots, traces e relatório HTML reais
- [ ] validar visualmente dashboard e telas autenticadas com dados reais

## 4. Configuração real de e-mail

- [x] confirmação, reenvio, recuperação e troca de e-mail implementados
- [x] templates HTML criados
- [x] cooldown de reenvio e mensagem antienumeração implementados
- [x] logs confirmaram envio pelo mailer padrão do Supabase
- [x] logs revelaram redirect incorreto para `http://localhost:3000`
- [!] escolher e configurar provedor SMTP
- [!] verificar domínio e configurar SPF, DKIM e DMARC
- [!] testar Gmail, Outlook, spam, bounce e limites de envio
- [!] revisar remetente, validade e políticas no painel

## 5. Configuração do Supabase Auth

- [!] definir Site URL como domínio oficial da Vercel
- [!] autorizar `https://nummi.vercel.app/**`
- [!] manter apenas redirects locais realmente usados, preferencialmente `http://localhost:5173/**`
- [!] remover `http://localhost:3000` se não houver mais desenvolvimento nessa porta
- [!] ativar proteção contra senhas vazadas
- [!] configurar CAPTCHA
- [!] revisar limites de cadastro, login e recuperação
- [!] revisar expiração de tokens, sessões e refresh tokens
- [x] confirmação obrigatória, recuperação e alteração segura de e-mail contempladas no frontend
- [x] links expirados/reutilizados possuem tratamento explícito
- [ ] decidir estratégia futura de MFA

## 6. Usuários já criados

- [x] criar perfis ausentes
- [x] criar ajustes ausentes e migrar tema padrão para escuro
- [x] verificar contagens sem expor e-mails no repositório
- [~] 1 de 3 usuários está confirmado
- [!] reenviar confirmação aos 2 usuários pendentes depois da correção de Site URL
- [!] testar login da conta confirmada no domínio oficial
- [!] revisar e remover contas duplicadas ou de teste
- [x] isolamento entre dois usuários já foi validado no banco

## 7. CI e gates

- [x] Node 22 definido
- [x] workflow reduzido a permissões somente de leitura
- [x] timeout e concorrência configurados
- [x] lint, testes, TypeScript, build, bundle e API pública no workflow
- [x] Playwright e upload de artefatos configurados
- [x] Vercel executa `npm run check` como gate de deploy
- [x] smoke hostil da API faz parte do gate da Vercel
- [~] GitHub Actions comprovadamente falha antes do checkout com zero steps
- [!] corrigir habilitação, cobrança ou política administrativa do GitHub Actions
- [ ] gerar e revisar `package-lock.json` em ambiente com acesso ao registro público
- [ ] migrar instalação para `npm ci` após o lockfile
- [!] configurar proteção obrigatória da `main` quando Actions estiver operacional

## 8. Testes de autenticação

- [x] senha forte e confirmação de senha testadas
- [x] normalização e validação local de e-mail testadas
- [x] cooldown de recuperação e confirmação implementado
- [x] senha atual é validada antes da troca
- [x] troca de e-mail usa retorno distinto
- [x] logout global exige confirmação
- [x] erros de link expirado/reutilizado tratados
- [~] logs validaram cadastro, envio e confirmação, mas não login concluído
- [ ] validar ponta a ponta login, recuperação, troca de senha/e-mail e múltiplas sessões no domínio oficial

## 9. Testes hostis

- [x] RLS entre dois usuários para leitura, alteração, exclusão e falsificação de `user_id`
- [x] CORS oficial 204 e origem hostil 403
- [x] JWT ausente 401
- [x] worker quebrado detectado e corrigido
- [x] idempotência de recorrências testada
- [x] campos extras e datas impossíveis testados por schemas
- [x] payload, paginação, offset, importação e exportação possuem limites
- [x] CSV Formula Injection neutralizada
- [x] funções temporárias exigem JWT
- [ ] fuzzing autenticado amplo com token real
- [ ] brute force e credential stuffing com CAPTCHA/rate limit administrativo configurados
- [ ] carga concorrente representativa com milhares de registros

## 10. QA tela por tela

- [x] revisão estática de login, cadastro e recuperação
- [x] revisão estática de dashboard, lançamentos, automações, orçamentos, relatórios e configurações
- [x] feedback, estados vazios, ações destrutivas e loading revisados
- [x] troca de tema com rollback em erro
- [x] sessões com erro visível e confirmação global
- [x] categoria não dispara refresh duplicado
- [ ] QA humano em navegador de todas as telas autenticadas
- [ ] QA com valores extremos, textos longos e dados volumosos

## 11. Acessibilidade

- [x] labels e nomes acessíveis revisados nas telas principais
- [x] foco visível e `prefers-reduced-motion` contemplados
- [x] botões de ícone críticos possuem `aria-label`
- [x] barras de categoria possuem descrição textual
- [x] Error Boundary fornece recuperação sem tela branca
- [~] contraste e responsividade revisados estaticamente
- [ ] auditoria automatizada WCAG em navegador
- [ ] leitor de tela, zoom 200%/400% e alto contraste
- [ ] validação real de foco em todos os modais

## 12. Desempenho

- [x] build de produção concluído
- [x] 1.718 módulos compilados na medição anterior
- [x] bundle total aproximadamente 505 KB, dentro do orçamento
- [x] lazy loading por domínio
- [x] snapshot paralelo e limitado
- [x] resumo recusa resultados truncados
- [x] somas financeiras movidas para centavos inteiros
- [x] orçamentos e relatórios usam aritmética monetária segura
- [x] testes de drift `0.1 + 0.2` adicionados
- [x] índices preservados até existir amostra de uso representativa
- [ ] Lighthouse e Core Web Vitals
- [ ] testes com 1.000 e 5.000 lançamentos
- [ ] p95/p99 de API e consultas com `EXPLAIN ANALYZE`

## 13. Observabilidade e operação

- [x] `request_id` e logs estruturados básicos na API
- [x] Error Boundary no frontend
- [x] runbook de login, API 500, RLS, recorrências e desempenho
- [x] política de backup e roteiro de restauração documentados
- [x] rollback de frontend, Edge Function e banco documentado
- [ ] serviço externo de captura de erros do frontend
- [ ] alertas automáticos para 500, 429, falhas de e-mail, espaço e conexões
- [ ] teste real de restauração de backup

## 14. Encerrar backend legado

- [x] frontend não depende do Apps Script
- [x] código legado removido da nova aplicação
- [x] busca de árvore não encontrou referências funcionais a carteira, patrimônio, investimentos ou metas
- [!] exportar ou validar dados reais ainda existentes nas planilhas
- [!] revogar e despublicar o Web App do Apps Script
- [!] apagar tokens e acessos antigos
- [!] definir retenção ou exclusão das planilhas

## 15. Sobras funcionais antigas

- [x] buscar termos em português e inglês
- [x] tipos e rotas atuais não incluem módulos removidos
- [x] navegação contém apenas visão geral, lançamentos, recorrências, orçamentos, relatórios, conta e ajuda
- [x] backend atual não possui coleções de investimento/meta
- [~] histórico Git conserva commits antigos, como esperado; a árvore atual está limpa

## 16. Revisão financeira

- [x] valores positivos, finitos e limitados
- [x] previstos e realizados separados
- [x] dias 29, 30 e 31 preservam dia-base
- [x] fevereiro e ano bissexto cobertos na recorrência
- [x] idempotência evita duplicação na mesma janela
- [x] precisão de centavos testada e aplicada
- [x] categorias de outro usuário bloqueadas por FK composta/RLS
- [x] categoria em uso retorna conflito em vez de exclusão silenciosa
- [x] exportação respeita intervalo e neutraliza fórmulas
- [~] fuso horário configurável, mas precisa de QA ponta a ponta nas viradas de dia/mês
- [ ] teste concorrente amplo entre automação e criação manual

## 17. Documentação final

- [x] README alinhado à ausência atual de lockfile
- [x] arquitetura, segurança, API e OpenAPI
- [x] Auth/SMTP com incidente de localhost documentado
- [x] QA, desempenho, operação e auditoria do legado
- [x] backup, restauração, rollback e incidentes
- [x] limitações externas registradas sem serem marcadas como concluídas
- [x] checklist atualizado como fonte de verdade

## 18. Publicação final

- [x] branch limpa de instrumentação temporária
- [x] API e repositório sincronizados
- [x] gates disponíveis passaram na Vercel
- [x] advisors revisados
- [x] PR #6 permanece mergeável
- [ ] mesclar o PR #6 por squash
- [ ] confirmar deploy da `main`
- [ ] repetir smoke pós-deploy
- [!] corrigir Site URL/redirects, SMTP, CAPTCHA e leaked-password protection no painel
- [!] validar conta real, confirmação, login e recuperação no domínio oficial
- [ ] alinhar branches remanescentes à nova `main`

## Resumo executivo

- [x] instrumentação temporária removida ou neutralizada
- [x] API implantada sincronizada com GitHub
- [x] Vercel executa gate completo incluindo smoke hostil
- [x] autenticação e aritmética financeira receberam novas correções/testes
- [!] configuração administrativa de Auth/SMTP permanece externa
- [~] QA real de navegador permanece bloqueado por runners indisponíveis
- [ ] merge e validação pós-produção ainda pendentes
