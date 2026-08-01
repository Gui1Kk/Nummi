# Operação e deploy

## CI

Pull requests e `main` executam lint, testes e build. O deploy só deve avançar com os checks verdes.

## Vercel

Configure as três variáveis `VITE_*` descritas no README. O arquivo `vercel.json` aplica CSP e cabeçalhos defensivos.

## Supabase

Após cada mudança de DDL:

1. aplicar migration versionada;
2. executar testes de RLS;
3. rodar Security Advisor e Performance Advisor;
4. gerar novamente os tipos TypeScript;
5. revisar grants e funções `SECURITY DEFINER`.

## Recuperação

- migrations são a fonte do schema;
- exportações de usuário devem ser testadas periodicamente;
- alterações destrutivas exigem backup e plano de rollback;
- incidentes exigem revogação de sessões/chaves e análise de logs.
