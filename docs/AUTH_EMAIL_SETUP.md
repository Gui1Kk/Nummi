# Autenticação e e-mail

## Fluxos implementados

- cadastro com nome, e-mail, senha forte e confirmação de senha;
- confirmação obrigatória do endereço;
- reenvio da confirmação com bloqueio visual de 60 segundos;
- recuperação de senha com resposta que não revela se a conta existe;
- tela segura para definir a nova senha após `PASSWORD_RECOVERY`;
- alteração de senha autenticada exigindo a senha atual;
- alteração de e-mail com confirmação do novo endereço;
- encerramento local, dos outros dispositivos ou global;
- tratamento de links expirados, reutilizados e inválidos.

## Incidente observado em 4 de agosto de 2026

Os logs de Auth registraram uma confirmação válida seguida de redirecionamento para `http://localhost:3000`. Uma segunda abertura do mesmo link foi rejeitada com `One-time token not found`, comportamento esperado para token de uso único.

A correção operacional obrigatória é substituir o endereço local como destino principal antes de considerar o fluxo de produção concluído.

## URLs que devem estar autorizadas

No painel Supabase, em **Authentication > URL Configuration**:

- **Site URL:** `https://nummi.vercel.app` ou o domínio oficial definitivo;
- **Redirect URLs de produção:** `https://nummi.vercel.app/**`;
- **Previews:** somente o padrão de previews necessário ao projeto, caso o painel aceite wildcard controlado;
- **Desenvolvimento:** `http://localhost:5173/**`, que é a porta padrão atual do Vite;
- remover `http://localhost:3000` se ele não for mais utilizado.

A aplicação passa o próprio `window.location.origin` em `emailRedirectTo`/`redirectTo` e usa:

- `?auth=confirmed` para confirmação de conta;
- `?auth=recovery` para recuperação de senha;
- `?auth=email-change` para confirmação do novo endereço.

Depois de alterar o painel, crie uma conta nova e confirme que o link retorna ao domínio oficial. Links emitidos antes da mudança podem continuar contendo o destino antigo e devem ser reenviados.

## SMTP de produção

O servidor SMTP padrão do Supabase é apenas para desenvolvimento e pode restringir destinatários. Para usuários públicos, configure um provedor SMTP próprio, por exemplo Resend, Postmark, SES, SendGrid ou Brevo. São necessários host, porta, usuário, senha e endereço remetente, credenciais que não devem ser versionadas.

Configuração recomendada:

- `mailer_autoconfirm = false`;
- mudança segura de e-mail ativada;
- SPF, DKIM e DMARC no domínio remetente;
- CAPTCHA no cadastro e na recuperação antes de abrir o produto ao público;
- proteção contra senhas vazadas ativada;
- limites de envio compatíveis com a base de usuários;
- remetente e domínio verificados;
- validade e cooldown dos links revisados.

Os modelos em `supabase/templates` podem ser copiados para **Authentication > Email Templates**.

## Roteiro de validação final

1. criar uma conta nova no domínio oficial;
2. confirmar que o e-mail foi entregue;
3. abrir o link uma vez e verificar o retorno à Vercel;
4. confirmar que reutilizar o link mostra mensagem de expirado;
5. entrar com a conta confirmada;
6. solicitar recuperação e definir nova senha;
7. alterar o e-mail e confirmar o novo endereço;
8. verificar os logs sem expor endereço, token ou senha em documentos públicos.
