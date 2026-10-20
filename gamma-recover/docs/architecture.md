# Arquitetura implementada

## Aplicação

Uma aplicação React + TypeScript + Vite, sem monorepo. React Router fornece rotas administrativas; o portal anterior está fora do roteamento. As páginas são carregadas por importação dinâmica. Styled-components usa um único tema. React Hook Form + Zod validam cadastros; regras permanecem nos serviços. TanStack Query possui uma consulta `['database']`, adequada à base pequena de demonstração.

## Caminho da informação

Página → `useAction` → serviço responsável → `transact` → transação IndexedDB readwrite → leitura atual da base no mesmo object store → verificação de contexto/regras → alteração em cópia → auditoria → validação integral → gravação única → invalidação de consulta → renderização dos módulos relacionados.

Transações readwrite sobre o mesmo object store serializam mutações entre abas da mesma origem. Mensagens `BroadcastChannel` invalidam consultas em outras abas. O adaptador lê a versão mais recente em cada operação e não mantém uma segunda cópia mutável em memória. Erros de gravação rejeitam a operação, sem confirmação indevida. Restauração também é transacional. Navegadores sem IndexedDB recusam gravações.

## Responsabilidades

| Arquivo                     | Responsabilidade                                                                            |
| --------------------------- | ------------------------------------------------------------------------------------------- |
| `services/domain.ts`        | Cálculo em centavos, geração de propostas/acordos/parcelas, indicadores e estados derivados |
| `services/operations.ts`    | Carteiras, devedores, cobranças, propostas, acordos, pagamentos e campanhas                 |
| `services/admin.ts`         | Credores, políticas, parâmetros e troca explícita de perfil demo                            |
| `services/import.ts`        | CSV com delimitador ponto e vírgula, validação, prévia e importação atômica                 |
| `services/reports.ts`       | Seis relatórios e exportação CSV com neutralização de fórmulas                              |
| `services/schema.ts`        | Validação estrutural e de vínculos/somas da base persistida                                 |
| `services/store.ts`         | Contexto, permissões e transações auditadas; adaptador nativo em `services/persistence.ts`  |
| `services/portalSession.ts` | Sessão demo de 30 minutos e expiração                                                       |

Os contratos de entidades estão em `types/domain.ts`. As funções dos serviços retornam Promises e podem ser substituídas por chamadas HTTP preservando o comportamento observado pelas páginas. No backend futuro, contexto/permissões devem vir da identidade autenticada no servidor, não dos parâmetros fornecidos pelo navegador. Persistência local, seleção de perfil e sessão demo devem ser substituídas.

## Isolamento e segurança

O seletor de credor limita consultas e os serviços revalidam a propriedade da dívida. O portal filtra pelo devedor da sessão e valida sessão novamente na mutação. Isso é comportamento demonstrativo de interface, não proteção de dados reais. Não há segredo no bundle, nem autorização efetiva sem servidor.

O bloqueio de uma pessoa é global na demonstração; uma contestação afeta apenas o contrato contestado. A fila usa contexto do credor para seus atendimentos. Identificadores importados exigem prefixo DEMO. Referências de pagamento são únicas na base. Restauração exige confirmação.

## Próxima integração real

Implementar autenticação/identidade, autorização e isolamento no servidor; endpoints para cada serviço; transações financeiras atômicas com idempotência; auditoria durável; paginação e filtros remotos; política de datas e relógio do servidor; validação de arquivos fora do cliente. Preservar os testes das regras e trocar somente o adaptador/serviços ligados à persistência. Não existe promessa de API já integrada.

## Compatibilidade da persistência demonstrativa

Uma base legada de mesma versão no localStorage é validada e lida quando IndexedDB ainda não possui um registro. A primeira mutação importa essa base e grava a alteração na mesma transação. A cópia legada permanece intacta; depois da importação, alterações nela não substituem o estado novo. Restauração explícita cria o cenário inicial no IndexedDB, inclusive quando o legado está inválido. A migração é idempotente e tem teste de preservação. Não há versão antiga publicada em produção neste projeto; não operar builds anteriores simultaneamente. Para recuperar uma versão anterior de dados, preservar uma cópia antes de restaurar a demonstração.

## Evolução visual e leitura do dashboard

`services/dashboard.ts` e `dashboardPeriods.ts` compõem um modelo somente de leitura. Reutilizam `metrics` e `agreementStatus` sem alterar serviços transacionais, políticas, mocks, contratos ou persistência. A página Dashboard compõe componentes menores (indicadores, recebimentos, composição da carteira, operação, acordos recentes e pendências). Estilos de layout, gráficos e componentes ficam separados.

Recharts é a única dependência de execução adicionada para visualizações responsivas, tooltips e navegação acessível. O módulo de dashboard continua carregado sob demanda pelo roteador. Tokens e componentes compartilhados distribuem a mesma identidade aos módulos existentes. Navegação, busca, ordenação, importação, negociação, cancelamento, conciliação, exportações e portal permanecem nos serviços/rotas anteriores.

## Sessão administrativa demonstrativa

`services/adminSession.ts` valida as credenciais fictícias, seleciona o perfil pelos serviços existentes e mantém somente e-mail, versão e expiração no navegador. `AdminAuthProvider` acompanha entrada/saída, eventos entre abas, retorno do foco e expiração. `AdminGuard` protege o layout administrativo; `/login` permanece fora desse guard; o portal está fora do roteamento. O destino pós-login aceita apenas rotas administrativas internas.

A saída remove a sessão e reinicia o contexto do credor, sem remover a base IndexedDB. A sessão é compartilhada entre abas da mesma origem e dura oito horas. Senhas não são persistidas nem incluídas em auditoria. Isso não altera as regras financeiras nem constitui segurança efetiva de backend.

## Empresas contratantes

`Creditor` é a empresa contratante/credora; não existe uma segunda lista de empresas. `profile` opcional acrescenta contatos e um contrato de prestação de serviços. O cadastro usa `CreditorService`, validação Zod, transação e auditoria existentes. Carteiras conservam `creditorId`; dívidas conservam `portfolioId`. A referência do contrato de serviços é distinta da referência da dívida.

A expansão é aditiva na versão 1: leitores aceitam credores sem `profile` e importações sem `actor`. Leituras não preenchem nem gravam campos artificialmente. O cadastro complementar é persistido somente no salvamento. Alterações de política conservam o perfil e o anexo. A validação recusa importações órfãs. Testes verificam a preservação de carteiras, dívidas, acordos e parcelas ao complementar uma empresa antiga.

PDFs são armazenados como data URL com limite de tamanho e verificação de cabeçalho PDF, na mesma transação; o download usa Blob, sem renderizar o arquivo no aplicativo. Essa verificação não equivale a antivírus ou assinatura digital. Falhas de leitura/gravação não confirmam cadastro. Para uma implantação real, substituir por armazenamento de arquivos no backend com autorização e controles próprios.

Não operar versões anteriores e novas simultaneamente: esquemas antigos podem descartar os novos campos ao gravar. Antes de retornar a um build anterior, preservar uma cópia da base IndexedDB; restaurar o build atual para voltar a ler os campos adicionados. Não há remoção de campos nem migração destrutiva nesta etapa.

## Escopo inicial: painel interno

O portal do devedor não é disponibilizado nesta versão. Seu layout e páginas não são importados pelo roteador nem geram entradas de páginas no build. Links foram removidos da sidebar, menu do usuário e login. `/portal` e qualquer subrota passam pelo fallback de página não encontrada. O código anterior e as validações compartilhadas foram preservados para eventual retomada, sem alterar a base ou as regras financeiras. Esta definição substitui as descrições anteriores de acesso público ao portal neste documento.

## Canais do contribuinte

`services/contactChannels.ts` concentra validação, normalização brasileira de telefones e construção dos destinos `wa.me`, `tel` e `mailto`. WhatsApp é um campo explícito, sem inferência a partir do telefone. `DebtorContactService` atualiza o cadastro compartilhado por pessoa em transação auditada, revalidando perfil e vínculo da dívida ao contexto. A interface reutiliza `ContactChannels` no cadastro, na fila e no modal de atendimento. Links externos não registram automaticamente atendimento e não enviam mensagens pelo sistema.

A expansão é aditiva: WhatsApp e preferência são opcionais; contatos antigos continuam legíveis sem canal/destino. Telefone e e-mail vazios representam ausência, sem marcadores inventados em novas importações. `CollectionService.record` valida o canal escolhido e obtém o destino do cadastro vigente na mesma transação; o histórico conserva esse destino após mudanças no cadastro. Registros novos sem canal explícito usam Registro interno; os anteriores sem canal permanecem sem atribuição retroativa. O CSV aceita os formatos fixos de cinco ou oito colunas e rejeita divergências em contatos existentes de forma atômica.

Não operar builds anteriores e atuais simultaneamente: leitores antigos podem descartar os campos adicionados. Nenhuma base é reiniciada por essa evolução; preservar cópia da base antes de qualquer retorno a build anterior. Comunicação integrada real, prova de titularidade, consentimentos e confirmação de entrega dependerão de backend e provedores próprios.

## Conversas locais

`services/conversations.ts` é responsável por abertura única, validação de contexto e mutações de rascunhos auditadas. `conversationSchema` valida corpo, destino, referências e unicidade; a coleção opcional conserva compatibilidade de leitura com bases antigas. `modules/conversations` oferece lista, busca, painel e editor local. Não há dependência HTTP/SDK do provedor, backend ou segredo no frontend. O estado de envio fica indisponível, sem confirmação simulada. A especificação e a restrição de elegibilidade Meta estão em `docs/whatsapp-integration.md`.

## Formulário de empresas

O modal de cadastro agrupa identificação, contato e contrato, com duas colunas em telas maiores e uma em celulares. Campos textuais exibem exemplos fictícios; os rótulos permanecem visíveis. O seletor de PDF informa limite de 2 MB, mostra o nome selecionado e permite substituição ou remoção, preservando a validação de conteúdo no serviço. Os controles compartilhados têm estados de foco, desabilitado e erro.


## Suspensão por contrato

`services/debtSuspension.ts` registra suspensão e retomada transacionais, com motivo, autor, data e revalidação do estado para evitar confirmação duplicada. `Debt.suspensionHistory` é opcional; a última ocorrência define a suspensão. Administrador/Operador podem alterar somente contratos no contexto. Contatos, conversas e negociação revalidam a restriééo no serviéo; fila, saldo elegível e campanhas a respeitam. Campanhas revalidam o público ao simular. Acordos e recebimentos existentes são preservados. Retomar não remove outras restrições. O histórico está no cadastro do devedor.

Não operar builds antigos e atuais simultaneamente; preservar cópia IndexedDB antes de rollback. A análise do estudo e próximos critérios estão em `docs/estudo-mercado-gap-analysis.md`.


## Análise de carteira e localização

`services/portfolioAnalytics.ts` calcula a posição atual por dívida/parcela, faixas de atraso, vencimentos e cidade. A visão consolidada evita dupla contagem, mantém os bloqueios como restrições operacionais e exclui parcelas de acordos cancelados/rompidos. É somente leitura; filtros e exportação usam os mesmos registros. `services/location.ts` valida cidade/UF e normaliza agrupamentos; `services/debtorLocation.ts` edita a localização opcional da pessoa com contexto, perfil, transação e auditoria. O CSV aceita cinco, oito ou dez colunas; conflito de localização reverte o lote. Bases sem localização continuam válidas, sem inferência ou preenchimento em consulta.

Ver `docs/dashboard-kpis.md` para fórmulas, limite de cinco anos, dimensões, compatibilidade e escopos dos filtros. Não executar builds antigos simultaneamente; preservar cópia IndexedDB antes de rollback.


## Padrão operacional de tarefas e réguas

Ver `docs/padrao-operacional.md`: novas coleções opcionais tasks/journeys/journeyRuns; atendimentos novos preservam contrato/ator e agendamentos criam tarefa atomicamente; conclusão de tarefa não representa encerramento de cobrança nem pagamento; encerramento novo afeta apenas o contrato. Réguas são versionadas e suas simulações preservam resultados e motivos, sem execução de canais. Edição revalida a revisão e a simulação idempotente revalida elegibilidade. O dashboard usa abas e conversas mostram contexto lateral responsivo. Não preencher vínculos antigos artificialmente, não usar builds antigos simultaneamente e preservar cópia antes de rollback.
