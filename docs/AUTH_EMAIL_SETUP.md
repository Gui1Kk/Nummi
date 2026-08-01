# Autenticação e e-mail

## Fluxos implementados

- cadastro com nome, e-mail, senha forte e confirmação de senha;
- confirmação obrigatória do endereço;
- reenvio da confirmação com bloqueio visual de 60 segundos;
- recuperação de senha com resposta que não revela se a conta existe;
- tela segura para definir a nova senha após `PASSWORD_RECOVERY`;
- alteração de senha autenticada exigindo a senha atual;
- alteração de e-mail com confirmação do novo endereço;
- encerramento local, dos outros dispositivos ou global.

## URLs que devem estar autorizadas

No painel Supabase, em **Authentication > URL Configuration**:

- Site URL: domínio de produção da Vercel;
- Redirect URLs: domínio de produção, previews do Nummi e `http://localhost:*` durante desenvolvimento.

A aplicação passa `emailRedirectTo`/`redirectTo` para o domínio atual e usa `?auth=confirmed` e `?auth=recovery` para concluir os fluxos.

## SMTP de produção

O servidor SMTP padrão do Supabase é apenas para desenvolvimento e pode restringir destinatários. Para usuários públicos, configure um provedor SMTP próprio, por exemplo Resend, Postmark, SES, SendGrid ou Brevo. São necessários host, porta, usuário, senha e endereço remetente, credenciais que não devem ser versionadas.

Configuração recomendada:

- `mailer_autoconfirm = false`;
- mudança segura de e-mail ativada;
- SPF, DKIM e DMARC no domínio remetente;
- CAPTCHA no cadastro e na recuperação antes de abrir o produto ao público;
- limites de envio compatíveis com a base de usuários.

Os modelos em `supabase/templates` podem ser copiados para **Authentication > Email Templates**.
