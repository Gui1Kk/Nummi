# Testes de banco executados

Foram executados no banco real:

- usuário B leu 0 registros do usuário A;
- usuário B atualizou 0 registros do usuário A;
- usuário B excluiu 0 registros do usuário A;
- tentativa de inserir com `user_id` forjado foi bloqueada;
- recorrência ancorada no dia 31 gerou 31/01, 28/02 e 31/03;
- a segunda execução da mesma janela criou 0 duplicatas;
- Security Advisor terminou sem alertas.

Esses testes devem ser transformados em SQL automatizado antes de mudanças futuras.
