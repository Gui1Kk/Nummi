# Auditoria concluída do legado

Escopo analisado: frontend React monolítico, serviço de API, tipos, utilitários, CSS e backend Google Apps Script presentes até o commit `939c32f`.

## Achados críticos

| Achado | Evidência no legado | Impacto | Tratamento |
|---|---|---|---|
| autenticação própria em planilha | hash SHA-256, salt e sessões implementados no Apps Script | aumenta superfície de falhas e não herda controles maduros de Auth | removida; Supabase Auth |
| Web App acessível por link | instrução `Anyone with the link` no backend | endpoint público sujeito a abuso e enumeração | backend removido |
| senha mínima insuficiente | formulário aceitava 3 caracteres em revisão inicial | credenciais triviais | política de 10 caracteres, caixa mista e número |
| token artesanal no Web Storage | sessão persistida pelo frontend legado | roubo por XSS e invalidação incompleta | sessão oficial PKCE do Supabase |
| autorização dependente de `username` | coleção escolhida pelo corpo da requisição | risco de acesso a objetos alheios | `auth.uid()` + RLS + filtro por proprietário |
| `save_all` substituía coleções inteiras | carga ampla sob uma única ação | perda de dados, race condition e mass assignment | CRUD estrito e schemas `.strict()` |
| importação CSV sem defesa suficiente | dados importados/exportados pelo Apps Script | fórmula maliciosa ao abrir em planilhas | prefixo seguro em células iniciadas por `= + - @` |
| automação no cliente e no servidor | processamento no carregamento e trigger diário | duplicação por abas/retries | função transacional idempotente no Postgres |

## Achados altos e médios

- `App.tsx` concentrava autenticação, navegação, formulários, cálculos e renderização;
- Carteira, investimentos, retornos e metas contaminavam tipos, resumo e persistência fora do escopo;
- erros do Auth eram mascarados como credenciais inválidas;
- cadastro não explicava confirmação de e-mail;
- recuperação de senha inexistente apesar de necessária;
- sem confirmação de senha;
- telas ofereciam criação e exclusão, mas pouca edição;
- tema escuro era um remendo, não um sistema visual completo;
- estados vazios, foco, teclado, contraste e responsividade eram inconsistentes;
- não havia testes automáticos no legado original;
- consultas sobre planilhas completas degradariam com crescimento;
- valores monetários e recorrências de fim do mês dependiam de lógica dispersa.

## Resultado

O código Apps Script e os módulos fora do escopo foram removidos. O frontend atual está dividido por domínio e a persistência usa PostgreSQL com constraints, índices, RLS, idempotência e API versionada.
