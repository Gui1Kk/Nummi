# Segurança

## Controles aplicados

- Supabase Auth, sem autenticação própria;
- RLS em todas as tabelas expostas;
- políticas separadas por operação e propriedade `auth.uid() = user_id`;
- `USING` e `WITH CHECK` em atualizações;
- grants explícitos e privilégios padrão revogados;
- schema `private` fora da Data API;
- funções privilegiadas revogadas de `anon` e `authenticated`;
- API com JWT, Zod estrito, body de 1 MB, paginação limitada e rate limiting;
- respostas genéricas sem stack trace;
- CSP e cabeçalhos de segurança na Vercel;
- proteção contra CSV Formula Injection;
- idempotência em criação/importação;
- trilha de auditoria para registros financeiros.

## Segredos

Somente `VITE_SUPABASE_PUBLISHABLE_KEY` pode ir ao navegador. `SUPABASE_SERVICE_ROLE_KEY` fica exclusivamente no ambiente da Edge Function. Não registrar JWTs, senhas, chaves ou conteúdo financeiro completo em logs.

## Testes obrigatórios

- usuário A não lê, altera ou remove registros do usuário B;
- tentativa de trocar `user_id` falha;
- ID inexistente e ID de outro usuário retornam resultado indistinguível;
- payload com campo desconhecido falha;
- lote, paginação e corpo acima do limite falham;
- idempotência evita duplicação;
- recorrências não criam duas ocorrências para a mesma data.

## Relato de vulnerabilidade

Não abra issue pública contendo dados pessoais, tokens ou prova explorável. Revogue credenciais comprometidas, preserve evidências e trate o incidente antes de divulgar detalhes.
