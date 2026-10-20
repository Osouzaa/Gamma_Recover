# Enterprise Compact

## Organização

Sidebar de 216px, recolhível para 68px, header de 60px, aviso de demonstração e conteúdo fluido com padding de 24px (16px no mobile). Páginas administrativas não usam max-width. Containers flexíveis e grids têm min-width:0. Portal tem layout próprio e largura de leitura controlada, adequado ao autoatendimento.

Cabeçalho de página: título, descrição curta e ações proporcionais. Indicadores são agrupados em uma faixa; filtros pertencem ao painel de dados. Evitar repetição de cartões decorativos. Controles administrativos medem aproximadamente 36px; em dispositivos pequenos, botões e campos passam a 44px.

## Componentes

Usar `components/ui.tsx`, `DataTable`, `PageHeader`, `Modal`, `Feedback` `ResetDemoDialog`, `MetricCard`, `Tooltip`, `SectionTabs`, `ContactTimeline` e `ScheduleProgress`. Componentes adicionais devem nascer de uso concreto. Input nativo de data fornece o seletor; checkbox e select nativos preservam comportamento de teclado. Não existe catálogo de componentes vazios.

Tabelas: cabeçalhos objetivos, números alinhados à direita, centavos formatados em pt-BR, estados escritos, ordenação explícita em colunas indicadas e paginação. Overflow horizontal fica no próprio container. Cabeçalhos de ordenação usam botões, aria-sort e controles de paginação nomeados.

Modais usam dialog nativo, showModal, Escape, nome acessível, controle de fechamento e retorno do foco ao elemento anterior. Preferir trabalho contínuo na página para cobrança e negociação. Cancelamento e restauração pedem confirmação contextual.

## Responsividade e acessibilidade

Abaixo de 760px, navegação vira menu recolhível, títulos e ações quebram linha e controles têm alvos maiores. Grids de duas colunas viram uma em 1100px. Indicadores reduzem o tamanho do valor em mobile. Tabelas e gráficos largos rolam internamente; a aplicação não deve ter overflow global.

Preservar labels nativos, foco visível, conteúdo semântico, títulos, mensagens role=alert/role=status e navegação por teclado. Ícones Lucide complementam rótulos; ações só por ícone têm aria-label. Não usar cor como único sinal. Respeitar prefers-reduced-motion.

Cada consulta possui carregamento e erro com nova tentativa; erro de base local permite restauração confirmada. Listas vazias explicam como buscar ou criar dados. Falhas de serviço devem ser exibidas; não exibir sucesso antecipadamente.

Verificações de navegador exercitam todas as rotas em desktop e 390px de largura, checam overflow global e capturam Dashboard em `artifacts/`. Essa verificação não equivale a auditoria completa de acessibilidade ou compatibilidade de todos os navegadores.

## Dashboard financeiro e operacional

O dashboard usa toda a largura disponível. Filtros de período e credor controlam as leituras temporais; um resumo sempre explicita as datas e o credor. A primeira faixa reúne carteira administrada, saldo elegível, recuperação no período e taxa de recuperação. Apenas o recebimento confirmado recebe uma superfície marinho em destaque. A segunda faixa reúne negociado, acordos ativos, inadimplência e eficiência.

Cada KPI possui uma definição acessível pelo botão de ajuda (hover, foco ou toque). Variações e tendências aparecem somente quando a janela anterior contém base válida. Ausência de histórico é escrita, sem setas ou percentuais inventados. Saldos, estados e pendências são posições atuais; não existe comparação histórica de saldos sem snapshots.

Gráficos Recharts responsivos, com eixo temporal, grade discreta, valores em reais, tooltip completo e legenda. A comparação de recebimentos pode ser ativada/desativada quando existe base anterior. Não animar as séries. Exibir estado sem dados quando não há recebimentos registrados. O gráfico de situações inclui os cancelados; cobertura da operação representa pessoas únicas e etapas cumulativas, sem atribuir causalidade ao atendimento.

Os acordos recentes mantêm consulta contextual. Pendências de conciliação, aprovações, parcelas vencidas e próximos vencimentos têm links operacionais; atalhos financeiros abrem o filtro correspondente. A consulta não grava nem recalcula os dados de domínio.

## Navegação e detalhes

O menu do usuário usa popover nativo, com fechamento por Escape e clique externo. Navegação móvel tem backdrop, Escape, foco contido e retorno ao acionador. Navegação recolhida conserva os nomes acessíveis e tooltips dos módulos. Breadcrumb acompanha os detalhes e o contexto do módulo.

Tabelas usam células de 10px × 16px, cabeçalhos de 12px, direção explícita de ordenação e alinhamento dos valores financeiros. A fila destaca a linha selecionada. Em mobile, ações preservam alvos de 44px. Formulários mantêm controles nativos e campos de 36/44px. Cabeçalhos de modais permanecem visíveis ao rolar, e o foco retorna ao acionador mesmo com StrictMode.

Detalhes de carteira combinam contratos vinculados e histórico de importações. Histórico de cobrança usa timeline, ordenada pelo atendimento mais recente. Acordos exibem progresso por quantidade de itens confirmados, sem sugerir percentual financeiro. O simulador destaca o total negociado no resumo, preservando a política e o aceite. Campanhas permitem consultar a seleção preservada de público, sem alegar envios. Configurações usam abas com setas, Home e End. Portal mantém layout próprio e realça sua navegação ativa.

Transições limitadas a hover, bordas e recolhimento (140ms); respeitar prefers-reduced-motion. Não criar notificações ou ações decorativas. A identidade visual centraliza cores semânticas, estados, raios e movimentos no tema existente.


## Referência aprovada: operação, indicadores, réguas e conversas

Seguir `docs/padrao-operacional.md` nas próximas telas: identidade Gamma, navegação nomeada, faixas de indicadores, abas para contextos distintos, tabelas compactas com detalhes ao lado, etapas de réguas em sequência e conversa com contexto do contrato. Em mobile, reordenar em blocos legíveis, sem estreitar o texto até ficar ilegível. Funcionalidades não integradas permanecem identificadas como simulação/rascunho.
