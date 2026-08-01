# Regras financeiras

## Transações

- `income`: aumenta o saldo.
- `expense`: reduz o saldo.
- `posted`: já ocorreu.
- `planned`: previsão, sem alterar o saldo realizado.
- transferências entre contas próprias não são receita nem despesa e estão fora do escopo atual.

## Recorrências

O dia-base é preservado. Quando não existe no mês, usa-se o último dia disponível. Uma regra ancorada no dia 31 gera 28/29 em fevereiro e volta ao dia 31 no mês seguinte.

A geração é idempotente por `(user_id, recurrence_id, occurrence_date)` e limitada por execução para impedir loops ou explosão de registros.

## Assinaturas

Assinaturas são sempre saídas. O ciclo pode ser mensal ou anual. O próximo vencimento segue a mesma regra de fim do mês das recorrências.

## Orçamentos

Cada usuário possui no máximo um orçamento por categoria e mês. Orçamento é um limite de saída, não uma conta ou saldo separado.

## Importação

- máximo de 500 linhas por lote;
- datas em `YYYY-MM-DD`;
- tipos `income` ou `expense`;
- valores positivos;
- conteúdo idêntico gera a mesma chave e não é importado duas vezes;
- células iniciadas por `=`, `+`, `-` ou `@` são neutralizadas na exportação.
