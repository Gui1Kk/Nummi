# Matriz de QA

## Autenticação

| Cenário | Resultado esperado |
|---|---|
| criar conta com senhas diferentes | bloqueio local |
| senha curta/fraca | requisitos apresentados e submissão bloqueada |
| tentar login sem confirmar e-mail | mensagem específica e ação de reenvio |
| reenvio repetido | cooldown de 60 segundos e tratamento do `429` |
| esquecer senha | resposta genérica, sem enumeração de conta |
| abrir link de recuperação | sessão temporária e tela para nova senha |
| trocar senha logado | senha atual obrigatória |
| trocar e-mail | confirmação enviada ao novo endereço |

## Testes hostis executados no Supabase real em 2026-08-01

- usuário B leu 0 linhas do usuário A;
- usuário B atualizou 0 linhas do usuário A;
- usuário B excluiu 0 linhas do usuário A;
- inserção com `user_id` falsificado foi bloqueada;
- reexecução da mesma recorrência criou 0 duplicatas;
- sequência mensal do dia 31 gerou 31/01, 28/02, 31/03 e avançou para 30/04;
- funções privilegiadas expostas ao papel autenticado foram removidas;
- tabelas no schema `private` tiveram privilégios explicitamente revogados de `PUBLIC`, `anon` e `authenticated`.

## Tela a tela

- autenticação: login, cadastro, confirmação, reenvio, recuperação e feedback;
- visão geral: competência, realizado, previsto, privacidade e assinaturas próximas;
- lançamentos: criar, pesquisar, filtrar, editar e excluir;
- recorrências: criar, editar, pausar, reativar e excluir;
- assinaturas: criar, editar, pausar, reativar e excluir;
- orçamentos: criar, editar, excluir, restante e excesso;
- relatórios: troca de mês, categorias e exportação CSV;
- conta: perfil, tema, privacidade, densidade, e-mail, senha e sessões;
- categorias: criar, editar, arquivar, restaurar e excluir quando não utilizadas;
- ajuda: regras de cálculo, segurança e limitações.

## Automação

Playwright cobre entrada de autenticação, tema padrão, confirmação de senha, recuperação e overflow mobile. Vitest cobre senhas, datas, schemas estritos e recorrências. O script de smoke público verifica rejeição sem JWT e origem hostil.
