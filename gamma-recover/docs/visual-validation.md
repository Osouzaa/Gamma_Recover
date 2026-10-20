# Validação da evolução visual

Executado em 19/10/2026, Node 24, Edge headless.

- 36 testes Vitest aprovados, incluindo os 28 anteriores e oito provas de leitura/comparação do dashboard.
- Nove cenários E2E aprovados: operação integrada, portal e isolamento, navegação dos módulos/mobile, aprovação e administração, concorrência entre abas, leitura financeira do dashboard, navegação recolhível/menu, teclado em detalhes/abas e larguras intermediárias.
- Overflow global verificado em todas as telas principais a 390px e desktop; matriz adicional de Dashboard, negociação, configurações e portal em 320/768/1024/1440px.
- O teste de leitura compara a base IndexedDB antes e depois de filtros, exportação e consulta financeira. Nenhum registro é alterado pelo dashboard.
- Hashes anteriores de mocks, tipos, serviços de domínio, operações, administração, relatórios, importação e persistência foram comparados: fontes preservadas integralmente. Referências em `artifacts/domain-before.json` e resultado em `artifacts/visual-validation.json`.
- Capturas anteriores e atuais estão em `artifacts/`, incluindo Dashboard, detalhe de carteira, timeline e portal móvel.

Build, TypeScript, ESLint e Prettier foram executados. Os avisos de anotação de comentários do Zod são do pacote existente e não impedem o build. A revisão não é uma auditoria completa de acessibilidade, desempenho ou compatibilidade de navegadores. As limitações demonstrativas e ausência de backend permanecem as descritas no README.
