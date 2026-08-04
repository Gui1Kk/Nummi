-- Remove artefatos criados exclusivamente para diagnosticar builds temporários.
-- Esta migration é idempotente e não afeta dados financeiros.

drop table if exists public.build_diagnostics_temp;
drop table if exists private.build_diagnostics;
drop extension if exists http;
