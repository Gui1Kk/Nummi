# Nummi API v1.2

Base: `https://uqisolhdsvzjmdvohbki.supabase.co/functions/v1/api-v1/v1`

Toda chamada exige `Authorization: Bearer <JWT Supabase>`. A Edge Function valida o JWT e o banco aplica RLS novamente. IDs pertencentes a outro usuário são tratados como não encontrados.

## Controles

- Zod estrito em body, path e query;
- parâmetros desconhecidos rejeitados;
- payload máximo de 1 MB;
- página máxima de 100 e offset máximo de 10.000;
- importação máxima de 500 linhas;
- exportação máxima de 10.000 linhas;
- `Idempotency-Key` de 8 a 128 caracteres;
- rate limit por usuário e rota;
- origens permitidas limitadas ao Nummi/Vercel e desenvolvimento local;
- CSV neutraliza células iniciadas por `=`, `+`, `-` e `@`;
- erros possuem `request_id` e não expõem SQL/stack.

As rotas e schemas estão em [openapi.yaml](openapi.yaml). Os fluxos de e-mail são feitos diretamente pelo Supabase Auth SDK, não pela API financeira.
