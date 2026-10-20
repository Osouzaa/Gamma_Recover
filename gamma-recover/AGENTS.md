# Gamma Recover — instruções permanentes

Memória de produto e prioridades discutidas com o usuário: leia `docs/memoria-produto.md` ao planejar próximas evoluções. O registro de recomendações não equivale a autorização para implementar todo o roadmap.

Aplicação frontend demonstrativa de recuperação de crédito. Leia `README.md`, `docs/architecture.md` e `docs/business-rules.md` antes de alterar fluxos.

Padrão visual aprovado pelo usuário em 20/10/2026: seguir `docs/standards/ui-ux.md` e `docs/padrao-operacional.md`. Usar a referência de tarefas, indicadores, réguas e conversas com identidade Gamma, navegação nomeada, tabelas compactas e detalhes no contexto; recursos demonstrativos nunca representam execução externa.

- React, TypeScript, Vite, Styled-components e npm. Não adicionar backend, banco real, autenticação de produção, mensageria ou pagamentos reais neste escopo.
- Usar exclusivamente pessoas, documentos e credores fictícios. Importações aceitam documentos `DEMO-...`.
- Tokens semânticos em `src/theme`. Nunca espalhar cores hexadecimais nos componentes. Seguir Enterprise Compact e não aplicar limite de largura nas páginas administrativas.
- Preservar separação do portal e do painel. Manter navegação por teclado, foco visível, estados de erro/carregamento e overflow de tabelas no próprio container.
- Componentes não calculam regras financeiras. Valores monetários são centavos inteiros; datas de vencimento são AAAA-MM-DD. Usar serviços de domínio.
- Uma única base demonstrativa. Mutações passam por `transact`, transações IndexedDB, validação, auditoria e invalidação TanStack Query. Não gravar cópias de dados em componentes.
- Revalidar credor, sessão, bloqueios, duplicidade, política e permissões dentro dos serviços. O frontend não substitui autorização de backend.
- Nenhuma aprovação excepcional ultrapassa a política máxima. Recebimentos exigem confirmação explícita e referência única; divergências não quitam parcelas.
- Organizar por módulo; arquivos preferencialmente abaixo de 250 linhas. Criar componentes e serviços apenas para usos reais.
- Executar `npm.cmd run lint`, `npm.cmd test`, `npm.cmd run build` e testes E2E pertinentes. Atualizar documentação com o comportamento realmente implementado.

- Rotas administrativas passam por `AdminGuard`; preserve login, expiração e logout entre abas. Não tratar credenciais públicas demonstrativas como autenticação de produção. O portal tem sessão independente.
