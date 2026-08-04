# Política de segredos

Chaves `service_role`, senhas SMTP, tokens de Management API e credenciais de e-mail nunca entram no frontend, commits, issues ou logs. Somente a chave publicável do Supabase pode ser entregue ao navegador, protegida por RLS e grants.
