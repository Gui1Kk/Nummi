# Segurança

## Camadas

1. Supabase Auth com PKCE, confirmação e recuperação por e-mail.
2. JWT obrigatório no gateway da Edge Function.
3. validação Zod estrita e limites de recurso.
4. filtro explícito por usuário na API.
5. RLS e constraints no PostgreSQL.
6. relações compostas `(user_id, id)` para impedir referências cruzadas.
7. auditoria em schema privado sem grants para clientes.
8. CORS restrito, CSP no frontend e respostas sem stack trace.

## Conta

- cadastro exige confirmação de senha;
- política local: 10+ caracteres, minúscula, maiúscula e número;
- login diferencia e-mail não confirmado sem revelar dados adicionais;
- recuperação sempre retorna mensagem genérica;
- troca de senha autenticada valida a senha atual;
- troca de e-mail exige confirmação no novo endereço;
- sessões podem ser revogadas localmente, em outros dispositivos ou globalmente;
- links expirados e inválidos recebem mensagem explícita, sem expor tokens.

## Schema privado

As tabelas `private.audit_log` e `private.api_rate_limits` ficam fora do schema exposto. A consulta de grants confirmou que `PUBLIC`, `anon` e `authenticated` não possuem privilégios nelas. A API acessa rate limit apenas por uma função `SECURITY DEFINER` restrita ao backend.

O inspetor de tabelas ainda marca RLS como desabilitado nessas duas tabelas privadas. Isso não equivale a exposição atual, mas habilitar RLS oferece defesa adicional. A ferramenta administrativa exige que essa mudança não seja aplicada automaticamente. O SQL candidato para uma revisão deliberada é:

```sql
alter table private.audit_log enable row level security;
alter table private.api_rate_limits enable row level security;
```

Antes de aplicar, valide em staging que o proprietário das funções privilegiadas continua ignorando RLS conforme esperado e que auditoria e rate limiting permanecem operacionais. Não crie policies para `anon` ou `authenticated`.

## Pendências administrativas

O Security Advisor informa que **Leaked Password Protection** está desativado. Ative em **Authentication > Password Security**. Configure também CAPTCHA, Site URL, redirects autorizados e SMTP próprio antes de abrir cadastros públicos.

Essas opções dependem do painel e, no caso do SMTP/CAPTCHA, de credenciais externas. Nenhum segredo foi inventado ou colocado no repositório.

## Verificação recorrente

Após qualquer migration, mudança de Auth ou rota nova:

1. execute os advisors de segurança e desempenho;
2. repita os testes com dois usuários;
3. teste origem permitida e hostil;
4. teste payload, query e campos extras;
5. confirme que `service_role` não aparece em código cliente, logs ou artefatos;
6. registre qualquer exceção deliberada neste documento.
