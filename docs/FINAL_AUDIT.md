# Auditoria final de atendimento

Data: 31 de julho de 2026

## Resultado executivo

O Nummi foi reconstruído sobre Supabase com foco em entradas, saídas, recorrências, assinaturas, orçamentos e relatórios. O backend Apps Script e os módulos de patrimônio, carteira, investimentos e metas foram removidos do código proposto.

Este documento diferencia implementação comprovada, implementação parcial e itens que exigem operação externa ou continuidade. Nenhum software conectado à internet pode ser declarado absolutamente invulnerável.

## Entregas comprovadas

- Supabase Auth substitui autenticação própria.
- PostgreSQL com valores `numeric(14,2)`, constraints, índices e RLS.
- Isolamento entre usuários testado para leitura, atualização, exclusão e falsificação de proprietário.
- Recorrências ancoradas no fim do mês e idempotência testadas no banco real.
- Edge Function `api-v1` implantada com JWT obrigatório, Zod estrito, paginação, limite de corpo, rate limiting e respostas sem stack trace.
- Frontend refeito sem patrimônio, carteira, investimentos ou metas.
- Documentação de arquitetura, API, segurança, regras financeiras, migração e operação.
- CI, testes unitários e smoke tests desktop/mobile adicionados.
- Supabase Security Advisor sem alertas após as correções.

## Atendimento parcial ou condicionado

- O frontend cobre o núcleo solicitado, mas não replica toda possibilidade existente em uma planilha. Transferências entre contas, parcelamentos, anexos, conciliação bancária, regras de fim de semana, webhooks e tokens pessoais de integração permanecem fora desta versão.
- A API oferece acesso amplo aos domínios implementados, mas ainda não possui OpenAPI gerado automaticamente, rotação de tokens pessoais ou webhooks.
- A importação/exportação existe na API; a interface visual ainda não oferece assistente completo de CSV.
- A inspeção visual automatizada cobre a entrada da aplicação e overflow móvel. Não substitui uma sessão humana completa em vários navegadores e dispositivos.
- Não houve migração de dados reais do Apps Script porque nenhum arquivo de exportação ou planilha de produção foi fornecido. O procedimento está documentado.
- Não foi possível executar `npm install` no ambiente local do agente devido ao proxy de pacotes. GitHub Actions e Vercel são os validadores de build e navegador antes do merge.
- A branch de produção do Supabase não foi separada de staging, porque criar uma branch de banco pode gerar custo e exige confirmação explícita do valor.

## Segurança

Foram cobertos os riscos principais de BOLA/IDOR, mass assignment, payload excessivo, paginação abusiva, replay, duplicação, CSV Formula Injection, exposição de detalhes internos, uso indevido de `service_role` no navegador e funções privilegiadas expostas.

Não é tecnicamente correto prometer segurança total. Dependências, navegador, infraestrutura, configuração de e-mail, credenciais, novas rotas e futuras alterações podem introduzir riscos. Toda mudança deve repetir advisors, testes RLS, CI e revisão de código.

## Comparação com a lista anterior de pendências

| Área | Estado | Evidência ou limite |
|---|---|---|
| Auditoria do legado | Parcial | Arquivos centrais e histórico de PRs analisados; o legado foi substituído, não certificado linha a linha como livre de bugs. |
| Execução do projeto | Parcial | Banco e API executados; build local bloqueado pelo proxy; CI/Vercel configurados. |
| Remoção de funcionalidades | Concluída no PR | Código e backend antigos removidos do novo tree. |
| Refatoração do frontend | Parcial | Separação em hooks, services, lib e schemas; `App.tsx` ainda concentra parte relevante da UI. |
| Projeto Supabase | Concluída | Projeto saudável em `sa-east-1`, schema e Edge Function ativos. |
| Modelo financeiro | Parcial | Núcleo completo; contas, transferências, parcelas e anexos não implementados. |
| Migração Apps Script | Parcial | Código substituído e plano escrito; dados reais não migrados. |
| API | Parcial avançado | CRUD, resumo, automações, importação/exportação; falta OpenAPI e tokens pessoais. |
| Segurança | Parcial avançado | RLS e ataques cruzados testados; segurança absoluta não existe. |
| Suíte de testes | Parcial | Unitários, banco e smoke E2E; cobertura ampla de componentes e API ainda não existe. |
| Usuário hostil | Parcial avançado | Ataques de propriedade, duplicação e recorrência testados; matriz completa exige campanha contínua. |
| Desempenho | Parcial | Índices e limites aplicados; faltam Core Web Vitals de produção e carga sustentada. |
| Documentação | Concluída para o escopo atual | README e documentos temáticos incluídos. |
| CI/CD e deploy | Parcial | CI e Vercel configurados; validação verde e produção devem ser confirmadas no merge. |
| Revisão final/merge | Condicionada | Só deve ocorrer com checks verdes. |

## Próximas extensões recomendadas

1. Materializar o schema e o código da Edge Function integralmente no repositório via Supabase CLI.
2. Adicionar contas, transferências e parcelamentos com semântica contábil explícita.
3. Publicar OpenAPI e testes de contrato.
4. Criar testes E2E autenticados e testes de carga.
5. Configurar staging, backups e alertas operacionais.
