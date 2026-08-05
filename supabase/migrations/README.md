# Migrations do Nummi

O banco deixou de depender de um estado implícito no painel. O repositório agora contém:

1. `20260801002936_nummi_core_secure_schema.sql`: baseline consolidado, reconstruído do catálogo PostgreSQL de produção;
2. arquivos de reconciliação com os mesmos IDs registrados no histórico remoto;
3. migrations funcionais posteriores, incluindo perfis, scheduler, notificações, resumo monetário em `numeric`, rollover e automações sob RLS.

## Reconstrução de um ambiente vazio

Execute as migrations em ordem cronológica com a Supabase CLI:

```bash
supabase db reset
```

O baseline cria as tabelas públicas, schemas privados, enums, constraints, índices, funções, triggers, grants e policies RLS. As migrations posteriores levam o banco ao contrato 1.3.

A validação destrutiva em um projeto Supabase vazio deve ser feita em uma branch de banco ou projeto descartável. A criação desse ambiente pode gerar custo e requer confirmação explícita do proprietário.

## Histórico

Algumas migrations de 1º de agosto existiam somente no histórico remoto. O SQL original byte a byte não estava disponível. Os respectivos arquivos de reconciliação são deliberadamente `no-op`: documentam o propósito e apontam para o baseline que materializa o estado final comprovado. Eles não fingem reproduzir conteúdo perdido.

Consulte `RECONCILIATION.md` para o mapeamento completo.
