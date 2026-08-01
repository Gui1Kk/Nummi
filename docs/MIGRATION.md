# Migração do Google Apps Script

O backend Apps Script anterior não deve permanecer ativo após a migração dos dados.

## Procedimento

1. exportar cada coleção legada;
2. guardar cópia imutável do arquivo original;
3. converter somente transações, categorias, recorrências, assinaturas e orçamentos;
4. descartar investimentos, retornos, metas, carteira e patrimônio;
5. normalizar datas e valores;
6. importar em lotes com chave idempotente;
7. reconciliar contagem, soma de entradas e soma de saídas por mês;
8. executar testes de amostragem;
9. revogar/desativar o Web App Apps Script;
10. remover URL e código legado do frontend.

Não migre senhas ou tokens do backend antigo. Cada usuário deve criar/redefinir sua conta pelo Supabase Auth.
