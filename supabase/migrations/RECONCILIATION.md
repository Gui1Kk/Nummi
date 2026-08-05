# Reconciliação do histórico de migrations

Data da reconciliação: 5 de agosto de 2026.

O catálogo do projeto `uqisolhdsvzjmdvohbki` foi usado como fonte de verdade para reconstruir o baseline. O SQL histórico original de algumas migrations não estava presente no repositório e não pode ser recuperado byte a byte pelo conector. Para preservar honestidade e reprodutibilidade:

- o estado estrutural final foi materializado em `20260801002936_nummi_core_secure_schema.sql`;
- cada ID remoto ausente ganhou um marcador SQL `no-op` com seu propósito conhecido;
- migrations temporárias permanecem apenas como marcadores e não reinstalam tabelas ou extensões removidas;
- mudanças funcionais da versão 1.3 possuem SQL integral próprio.

| Versão remota | Nome remoto | Representação no repositório |
|---|---|---|
| 20260801002936 | `nummi_core_secure_schema` | baseline consolidado executável |
| 20260801003008 | `harden_api_rate_limit_function` | marcador; estado incorporado ao baseline |
| 20260801003032 | `add_foreign_key_indexes` | marcador; índices incorporados ao baseline |
| 20260801003337 | `make_idempotency_upsert_compatible` | marcador; constraints incorporadas ao baseline |
| 20260801005022 | `fix_recurrence_helper_permissions` | marcador; grants/funções incorporados ao baseline |
| 20260801010147 | `enforce_tenant_safe_foreign_keys` | marcador; FKs compostas incorporadas ao baseline |
| 20260801011051 | `harden_rate_limit_and_summary_rpc` | marcador; versão final incorporada ao baseline e migrations 1.3 |
| 20260801020724 | `auth_profile_theme_private_hardening` | marcador; conteúdo equivalente preservado no baseline e migration histórica legada |
| 20260801021446 | `cover_composite_foreign_keys` | marcador; índices incorporados ao baseline |
| 20260801025456 | `temporary_http_diagnostics_extension` | marcador histórico, propositalmente não reinstala `http` |
| 20260801030122 | `temporary_build_diagnostics_store` | marcador histórico, não recria tabela temporária |
| 20260801030437 | `temporary_build_diagnostics_public_store` | marcador histórico, não recria tabela temporária |
| 20260804210953 | `remove_temporary_diagnostics_and_http_extension` | marcador; limpeza está refletida no baseline atual |
| 20260805002418 | `complete_non_external_checklist_core` | SQL funcional integral |
| 20260805002659 | `temporary_auth_login_validation_http` | não versionada como mudança funcional; prova temporária já revertida |
| 20260805002821 | `cleanup_http_after_auth_validation` | não versionada separadamente; `http` ausente no estado final |
| 20260805004920 | `move_automation_rpc_to_service_role` | transição superseded pela migration 20260805004950 |
| 20260805004950 | `make_user_automation_rpc_security_invoker` | SQL funcional integral |
| 20260805005408 | `temporary_http_for_authenticated_api_tests` | prova temporária, sem estado final |
| 20260805005526 | `cleanup_http_after_api_tests_blocked` | limpeza refletida no estado final |
| 20260805005546 | `temporary_http_public_api_v6_smoke` | prova temporária, sem estado final |
| 20260805005615 | `cleanup_http_after_public_api_v6_smoke` | limpeza refletida no estado final |

## Regra de manutenção

Novas alterações de banco devem ser escritas primeiro como migration no repositório e depois aplicadas ao Supabase. Não criar novas mudanças permanentes somente pelo painel ou por SQL avulso.
