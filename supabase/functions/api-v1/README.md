# Edge Function `api-v1`

Código-fonte da API financeira implantada no projeto Supabase `Nummi` com JWT obrigatório.

## Arquivos

- `index.ts`: roteamento, autenticação, recursos e respostas;
- `schemas.ts`: contratos Zod estritos;
- `http.ts`: CORS, limites, paginação, erros e proteção CSV;
- `deno.json`: configuração do runtime.

A versão de produção exige `SUPABASE_URL`, chave publicável, `SUPABASE_SERVICE_ROLE_KEY` e opcionalmente `ALLOWED_ORIGINS`. A chave privilegiada nunca deve entrar no frontend.

Implantação:

```bash
supabase functions deploy api-v1 --verify-jwt
```
