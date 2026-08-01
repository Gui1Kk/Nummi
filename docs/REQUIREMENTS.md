# Nummi — Requisitos do produto

## 1. Objetivo

O Nummi é uma plataforma pessoal de controle financeiro focada em entradas, saídas, compromissos futuros, recorrências e assinaturas. Deve substituir o uso cotidiano de planilhas financeiras sem adicionar complexidade de investimentos, patrimônio ou metas.

## 2. Princípios

1. O saldo deve ser explicável por lançamentos auditáveis.
2. Nenhum processamento recorrente pode gerar duplicatas.
3. Dados de um usuário jamais podem ser lidos ou alterados por outro.
4. Toda operação destrutiva deve ser recuperável ou explicitamente confirmada.
5. O sistema deve funcionar bem no celular e no desktop.
6. Segurança e integridade têm prioridade sobre conveniência.

## 3. Requisitos funcionais

### RF-001 — Autenticação

O usuário deve poder criar conta, entrar, sair, recuperar senha e encerrar sessões usando Supabase Auth.

### RF-002 — Perfil e preferências

O usuário deve poder definir nome, moeda, locale, fuso horário, primeiro dia do mês e preferências de notificação.

### RF-003 — Contas financeiras

O usuário deve poder criar contas simples, como dinheiro, conta-corrente e cartão. Uma conta não representa carteira de investimentos nem patrimônio.

### RF-004 — Entradas e saídas

O usuário deve poder criar, editar, duplicar, excluir e restaurar lançamentos de receita e despesa.

Campos mínimos:

- descrição;
- valor;
- tipo;
- categoria;
- conta;
- data de competência;
- vencimento opcional;
- data de pagamento opcional;
- status;
- observação opcional.

### RF-005 — Categorias

O usuário deve poder criar categorias e subcategorias próprias, arquivá-las e reorganizá-las sem perder histórico.

### RF-006 — Status financeiro

Um lançamento deve suportar ao menos: previsto, pendente, pago, vencido, cancelado e excluído.

### RF-007 — Recorrências

O usuário deve poder criar séries semanais, mensais, anuais e personalizadas.

A recorrência deve possuir uma chave de idempotência por série e período para impedir duplicatas.

### RF-008 — Assinaturas

O usuário deve poder controlar assinaturas com fornecedor, valor atual, periodicidade, próxima cobrança, forma de pagamento, categoria, status, lembrete e histórico de reajustes.

### RF-009 — Parcelamentos

O usuário deve poder registrar uma compra ou receita parcelada, com vínculo entre todas as parcelas, número atual, total de parcelas e possibilidade de editar apenas uma parcela ou a série futura.

### RF-010 — Orçamentos

O usuário deve poder definir limites mensais por categoria e visualizar consumo, saldo restante e projeção.

### RF-011 — Transferências

Transferências entre contas, quando habilitadas, devem gerar lançamentos vinculados e não alterar receita ou despesa consolidada.

### RF-012 — Importação

O usuário deve poder importar CSV por um fluxo de pré-visualização, mapeamento de colunas, validação e confirmação. Nenhum registro inválido deve ser aplicado silenciosamente.

### RF-013 — Exportação

O usuário deve poder exportar dados próprios em CSV e JSON. A exportação CSV deve neutralizar fórmulas.

### RF-014 — Relatórios

O usuário deve visualizar:

- receitas, despesas e saldo por período;
- comparação mensal;
- despesas por categoria;
- compromissos futuros;
- assinaturas próximas;
- evolução de despesas fixas e variáveis;
- orçamento versus realizado.

### RF-015 — Busca e filtros

O usuário deve filtrar por período, status, tipo, conta, categoria, valor e texto.

### RF-016 — Auditoria

Alterações relevantes devem registrar usuário, ação, entidade, identificador, horário e metadados seguros. Senhas, tokens e dados sensíveis completos nunca devem entrar nos logs.

### RF-017 — Lixeira

Exclusões de lançamentos, categorias e séries devem usar soft delete por período configurável antes da remoção definitiva.

### RF-018 — Ajuda e orientação

Formulários e estados vazios devem explicar o efeito das ações, especialmente recorrências, parcelamentos, importações e exclusões.

## 4. Requisitos não funcionais

### RNF-001 — Isolamento de dados

Todas as tabelas de usuário devem possuir `user_id` obrigatório, RLS habilitada e políticas de propriedade para SELECT, INSERT, UPDATE e DELETE.

### RNF-002 — Validação

Toda entrada externa deve ser validada com Zod no limite da aplicação. Objetos com propriedades não previstas devem ser rejeitados nas rotas sensíveis.

### RNF-003 — Valores monetários

Valores devem ser armazenados em `numeric`, com escala definida, e transportados por strings decimais ou minor units quando apropriado.

### RNF-004 — Datas e fuso horário

Instantes devem ser armazenados em `timestamptz`; datas civis financeiras podem usar `date`. Relatórios devem respeitar o fuso do usuário.

### RNF-005 — Segurança de API

A API deve aplicar autenticação, autorização por objeto e propriedade, rate limiting, limites de payload, idempotência, paginação limitada e respostas sem detalhes internos.

### RNF-006 — Desempenho

Listagens devem ser paginadas e indexadas. Consultas críticas devem possuir planos verificados. O frontend deve evitar carregamento integral do histórico quando não necessário.

### RNF-007 — Disponibilidade e recuperação

Migrações destrutivas exigem backup, rollback documentado e execução separada da remoção definitiva do Apps Script.

### RNF-008 — Qualidade

São obrigatórios typecheck, lint, testes unitários, testes de integração, testes de RLS e E2E para fluxos críticos.

### RNF-009 — Acessibilidade

A interface deve permitir navegação por teclado, foco visível, rótulos associados, mensagens de erro compreensíveis e contraste compatível com WCAG 2.2 AA.

### RNF-010 — Observabilidade

Erros devem possuir identificador de correlação. Logs precisam ser estruturados e minimizados, sem tokens, senhas ou conteúdo financeiro desnecessário.

## 5. Fora de escopo

- patrimônio líquido;
- carteira de investimentos;
- ativos financeiros;
- rentabilidade;
- metas financeiras;
- recomendação de investimento;
- conexão bancária automática nesta etapa.

## 6. Critérios de aceite da migração

1. Usuário consegue cadastrar, autenticar e recuperar senha.
2. Dois usuários de teste não conseguem acessar dados um do outro, mesmo alterando IDs manualmente.
3. Recorrências reprocessadas não criam duplicatas.
4. O histórico atual suportado é migrado ou exportável antes da desativação.
5. Carteira, investimentos, patrimônio e metas não aparecem no código funcional nem no banco novo.
6. Build, lint, typecheck, testes e E2E passam em CI.
7. Documentação da API e do deploy está atualizada.
