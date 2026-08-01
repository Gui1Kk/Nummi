# Ações administrativas externas

A segunda passada deixa o código pronto, mas quatro controles dependem do painel/provedor:

1. definir Site URL e Redirect URLs do frontend;
2. configurar SMTP próprio e domínio remetente;
3. ativar CAPTCHA no cadastro e recuperação;
4. ativar Leaked Password Protection.

Nenhuma dessas credenciais deve ser gravada no repositório. O aplicativo apresenta erros específicos quando redirects não estão autorizados e mantém recuperação sem enumeração de conta.
