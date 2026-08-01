# API v1

Base: `https://<project-ref>.supabase.co/functions/v1/api-v1/v1`

Todas as rotas exigem:

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

## Rotas

| Método | Rota | Uso |
|---|---|---|
| GET | `/health` | estado da API autenticada |
| GET | `/snapshot` | snapshot limitado para a interface |
| GET/PATCH | `/profile` | perfil do usuário |
| GET/PATCH | `/settings` | preferências |
| GET/POST | `/transactions` | listar e criar lançamentos |
| GET/PATCH/DELETE | `/transactions/:id` | operar um lançamento |
| GET/POST | `/categories` | categorias |
| GET/PATCH/DELETE | `/categories/:id` | categoria individual |
| GET/POST | `/recurrences` | recorrências |
| GET/PATCH/DELETE | `/recurrences/:id` | recorrência individual |
| GET/POST | `/subscriptions` | assinaturas |
| GET/PATCH/DELETE | `/subscriptions/:id` | assinatura individual |
| GET/POST | `/budgets` | orçamentos |
| GET/PATCH/DELETE | `/budgets/:id` | orçamento individual |
| GET | `/summary?from=YYYY-MM-DD&to=YYYY-MM-DD` | resumo do período |
| POST | `/automations/post-due` | processar vencimentos |
| POST | `/import/transactions` | importar até 500 linhas JSON |
| GET | `/export/transactions?format=json|csv` | exportar lançamentos |

## Paginação

`limit` entre 1 e 100; `offset` entre 0 e 10.000.

## Idempotência

Na criação de transações, envie `Idempotency-Key` com 8 a 128 caracteres. Repetir a mesma chave retorna o registro existente.

## Erros

```json
{
  "error": { "code": "VALIDATION_ERROR", "message": "Request validation failed" },
  "request_id": "uuid"
}
```

O `request_id` serve para correlação. A resposta não expõe SQL, stack trace ou detalhes internos.
