# Estado da segunda passada

## Concluído por código e banco

- causa do login diagnosticada como `email_not_confirmed`;
- confirmação, reenvio, recuperação e alteração de senha/e-mail;
- confirmação de senha no cadastro;
- perfil e preferências corrigidos para contas antigas;
- tema escuro neon como padrão e tema claro alternativo;
- frontend dividido por domínio e carregado sob demanda;
- edição, pausa, restauração e exclusão nas telas financeiras;
- API v1.2 modular sincronizada com o deploy;
- migrations de segurança e índices aplicadas;
- testes de senha, schemas, navegador, RLS e API pública;
- orçamento de bundle e documentação de QA/desempenho.

## Requer configuração administrativa externa

- SMTP de produção e DNS do remetente;
- Site URL e allow-list de redirects no Supabase;
- CAPTCHA;
- Leaked Password Protection.

Esses itens exigem credenciais de provedor ou configuração no painel Auth e não podem ser incorporados ao código-fonte.
