# Segurança

## Camadas

1. Supabase Auth com PKCE, confirmação e recuperação por e-mail.
2. JWT obrigatório no gateway da Edge Function.
3. validação Zod estrita e limites de recurso.
4. filtro explícito por usuário na API.
5. RLS e constraints no PostgreSQL.
6. relações compostas `(user_id, id)` para impedir referências cruzadas.
7. auditoria em schema privado sem grants para clientes.

## Conta

- cadastro exige confirmação de senha;
- política local: 10+ caracteres, minúscula, maiúscula e número;
- login diferencia e-mail não confirmado sem revelar dados adicionais;
- recuperação sempre retorna mensagem genérica;
- troca de senha autenticada exige `currentPassword`;
- troca de e-mail exige confirmação;
- sessões podem ser revogadas.

## Pendências administrativas

O Security Advisor informa que **Leaked Password Protection** está desativado. Ative em Authentication > Password Security. Configure também CAPTCHA e SMTP próprio antes de abrir cadastros públicos. Essas configurações não podem ser aplicadas por SQL nem pelo conector disponível.

As tabelas `private.audit_log` e `private.api_rate_limits` ficam fora do schema exposto. Seus privilégios foram explicitamente revogados de `PUBLIC`, `anon` e `authenticated`; somente funções/backend privilegiados as utilizam.
