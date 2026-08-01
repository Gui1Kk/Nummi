# Edge Function `api-v1`

A função está implantada no projeto Supabase `Nummi` com JWT obrigatório. A versão de produção implementa as rotas documentadas em `docs/API.md`, validação Zod estrita, limite de corpo, paginação, idempotência, rate limiting, CORS, cabeçalhos defensivos e respostas sem detalhes internos.

O código implantado deve ser exportado pelo Supabase CLI antes da próxima alteração e mantido sincronizado com este repositório. Não use `service_role` no frontend.
