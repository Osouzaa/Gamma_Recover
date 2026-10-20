# Marca Gamma

A interface é um software operacional financeiro da Gamma Estratégia & Consultoria. A assinatura Gamma Recover usa um símbolo geométrico Γ e um wordmark vetorial próprio desta aplicação, criado a partir da identidade existente.

Tokens centralizados em `src/theme/index.ts`:

| Papel                     | Valor   |
| ------------------------- | ------- |
| `brand.primary` / sidebar | #0B1B34 |
| `brand.accent`            | #29C979 |
| `background.app`          | #F3F5F8 |
| `background.surface`      | #FFFFFF |
| `text.primary`            | #17283E |
| `text.secondary`          | #586A80 |
| `border.default`          | #DCE3EB |

Estados usam famílias success, warning, danger e info, com texto escuro sobre fundos suaves. Verde identifica a ação principal e recebimentos no gráfico. Azul-marinho sustenta navegação e distribuição de carteiras. A cor nunca é o único indicador: estados possuem texto.

Tipografia: Segoe UI, system-ui, sans-serif, sem dependência de fontes remotas. Corpo 14px, auxiliar 12px, títulos 24px e valores 26px (20px em tela pequena). Pesos 400–600. Espaçamentos em escala 4, 8, 12, 16, 24 e 32px; raios 5/8px; sombra reservada para sobreposições.

Sem gradientes, glassmorphism, roxo dominante, imagens decorativas, emojis na interface, sombras em cartões ou textos promocionais na operação. Todos os dados pessoais e credores da demonstração são fictícios e identificados como tal.

A evolução visual mantém integralmente marinho, verde e branco da marca. As séries usam `chart.current`, `chart.previous` e `chart.grid`; diferenças de período também usam traço contínuo/tracejado. O card de recuperação usa marinho para priorizar o dinheiro efetivamente recebido. O símbolo Γ foi redesenhado geometricamente; ícones funcionais são Lucide. Não foram adicionadas imagens, fontes remotas ou gradientes.

## Logo e favicon

Arquivos em `public/brand`: assinaturas `gamma-recover-dark.svg` para fundos claros e `gamma-recover-light.svg` para fundos escuros, versões PNG transparentes e símbolo isolado. Os SVGs usam contornos vetoriais, sem fontes externas. `components/Logo` reúne símbolo e wordmark, preservando o nome acessível; a sidebar recolhida mantém somente o símbolo.

O login e a sidebar usam a mesma assinatura. O documento HTML referencia favicon SVG, ICO com tamanhos 16/32/48 e ícone Apple 180. O favicon mostra apenas o símbolo verde sobre marinho para preservar legibilidade em tamanhos pequenos. Não distorcer proporções nem usar a assinatura completa como favicon. O pacote `artifacts/brand/Gamma-Recover-Marca.zip` reúne os arquivos exportáveis.
