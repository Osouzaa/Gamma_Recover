# Validação das nove capacidades da referência

Data: 20/10/2026. Referência: imagem enviada pelo usuário com nove capacidades de uma plataforma de cobrança. A imagem define o comparativo; suas descrições comerciais não comprovam resultados ou integrações de fornecedores.

Atualização posterior nesta mesma data: o usuário aprovou a implementação do padrão visual. Foram acrescentados Tarefas e Réguas com simulação, vínculo de contrato/ator nos novos atendimentos, abas de indicadores e contexto lateral em conversas. O estado e os limites atuais estão em [Padrão operacional](padrao-operacional.md). A matriz abaixo preserva a fotografia da validação anterior; campanhas/réguas e fila evoluíram, mas continuam sem execução externa ou distribuição real de equipes.

Escopo: versão demonstrativa local do Gamma Recover. A decisão de manter a demonstração permanece válida. Este documento registra cobertura, lacunas e critérios de futuras entregas; não ativa serviços externos nem afirma equivalência com um produto de produção.

## Resultado do comparativo

| Capacidade da imagem          | Situação atual                                     | Evidência implementada                                                                                                    | O que falta para corresponder à referência                                                                                                                                                                                       |
| ----------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Régua de cobrança             | Parcial: campanhas e atendimento manual            | Segmentação por credor/atraso, público elegível, simulação sem envios; canais manuais e rascunhos locais                  | Jornada visual com etapas, gatilhos, condições, frequência, horários, pausa por eventos, templates e execução multicanal. Não há SMS, RCS ou discador integrado                                                                  |
| Restrições                    | Ausente como negativação/protesto                  | Existem bloqueio operacional, contestação e suspensão por contrato                                                        | Dossiê, autorização, quarentena, envio, retorno, retirada/baixa, contestação e integração com birôs/cartórios. Bloqueio de contato não equivale a restrição de crédito                                                           |
| Relatórios e dashboards       | Disponíveis na demonstração, com lacunas de gestão | KPIs financeiros/operacionais, vencidos/a vencer, cinco anos, gráficos de atraso, agenda, cidade/UF, filtros e exportação | Metas, responsável/equipe/assessoria, custos e rentabilidade. Atualização é local e entre abas da mesma origem; não existe operação centralizada em tempo real entre computadores                                                |
| Fila de cobrança              | Parcial: fila manual por contrato/credor           | Busca, seleção, canais, atendimento, retorno, promessa, histórico e bloqueios                                             | Distribuição, responsável, tomada/transferência, prioridade automática, SLAs, mailing/discador e prevenção de atendimento simultâneo. Retornos/promessas ainda não geram uma agenda de prioridade operacional                    |
| Portal de autonegociação      | Indisponível no sistema atual                      | Código legado preservado, sem rotas nem links ativos                                                                      | Reativação deliberada da experiência, ofertas elegíveis, sessão, termos, aceite, acompanhamento e atendimento. Acesso seguro e pagamento reais dependem da etapa de produção                                                     |
| Meios de pagamento            | Ausentes como instrumentos de pagamento            | Cronograma de parcelas e conciliação manual demonstrativa com referência única e divergência                              | Emissão de boleto/Pix, checkout de cartão, identificação de beneficiário, expiração, confirmação oficial, idempotência de eventos externos, falhas e estornos. Referência digitada e comprovante TXT não são boleto ou transação |
| Extração dinâmica de dados    | Parcial: relatórios predefinidos                   | Seis relatórios, filtros por assunto/período/credor e CSV; análise de carteira também exporta os registros filtrados      | Seleção de campos, agrupamentos, filtros combináveis, medidas permitidas, visualizações e consultas salvas com escopo. Não há construtor de relatórios ou consulta livre ao banco                                                |
| URA e robô de voz             | Ausente                                            | Links de telefone para acionamento manual                                                                                 | Provedor de telefonia, fluxo de URA, campanhas de voz, callbacks, transferência para operador, estados de chamada, custos e histórico. Abrir `tel:` não configura URA                                                            |
| Distribuição para assessorias | Ausente                                            | Empresas contratantes/credores e carteiras vinculadas                                                                     | Entidade assessoria prestadora, contratos, equipes, atribuição/devolução de títulos, vigências, escopos, histórico e resultados. Empresa credora não deve ser reutilizada como se fosse assessoria                               |

## Evidências no código

| Assunto                                       | Fonte verificada                                                                                                                                                                        |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Campanhas e revalidação do público            | [CampaignService](../src/services/operations.ts), [tela de campanhas](../src/modules/campaigns/pages/Campaigns/index.tsx)                                                               |
| Canais e rascunhos                            | [contactChannels](../src/services/contactChannels.ts), [conversations](../src/services/conversations.ts), [limites documentados da integração](whatsapp-integration.md)                 |
| Bloqueios operacionais                        | [domain](../src/services/domain.ts), [suspensão por contrato](../src/services/debtSuspension.ts)                                                                                        |
| Dashboard e extração                          | [dashboard](../src/services/dashboard.ts), [portfolioAnalytics](../src/services/portfolioAnalytics.ts), [reports](../src/services/reports.ts), [definições dos KPIs](dashboard-kpis.md) |
| Fila e registro de atendimentos               | [Collections](../src/modules/collections/pages/Collections/index.tsx), [CollectionService](../src/services/operations.ts), [entidades Contact/Database](../src/types/domain.ts)         |
| Rotas disponíveis e portal fora do roteamento | [roteador](../src/app/routes/index.tsx), [acesso legado do portal](../src/modules/debtor-portal/Access.tsx)                                                                             |
| Conciliação e confirmação financeira          | [PaymentService](../src/services/operations.ts), [Financeiro](../src/modules/financial/pages/Financial/index.tsx)                                                                       |
| Persistência e limites de tempo real          | [persistence](../src/services/persistence.ts), [store](../src/services/store.ts), [arquitetura](architecture.md)                                                                        |

A constatação de ausência resulta da inspeção das entidades, rotas, serviços e módulos correspondentes, complementada por busca por jornada/régua, restrições, protesto, negativação, quarentena, assessorias, URA, discador, SMS/RCS e instrumentos de pagamento. Uma palavra ausente na busca, isoladamente, não foi usada como prova. Não foram consultadas APIs de fornecedores ou ambientes de produção.

## Lacunas transversais encontradas

1. **Unidade de atendimento:** `CollectionService.record` recebe e valida `debtId`, mas persiste contatos com `debtorId` e `creditorId`, sem contrato nem operador estruturado. A fila usa qualquer contato encerrado dessa pessoa/credor para retirar os contratos da relação. Assim, encerrar um atendimento pode retirar outras dívidas da mesma pessoa com aquele credor. Para fila por contrato, o vínculo precisa ser preservado no registro e no encerramento. Registros antigos não podem receber um contrato/operador inventado.
2. **Responsabilidade operacional:** a transação serializa gravações IndexedDB, mas não há posse de atendimento, responsável ou transferência. A prevenção de acordos duplicados entre abas não equivale a impedir dois operadores de atenderem o mesmo contrato.
3. **Produtividade por pessoa da equipe:** o relatório chamado Produtividade lista atendimentos por resultado/data/devedor. O identificador exibido como Operação é o ID do contato, não a identificação do operador. A auditoria guarda um nome de ator; isso não substitui vínculo estruturado do atendimento ao operador/equipe.
4. **Campanha não é régua:** seleção de público e simulação não executam etapas, agendamentos ou canais. O público é revalidado ao simular; não há histórico de entregabilidade ou atribuição de recuperação a campanhas.
5. **Integração não é link externo:** `tel:`, `mailto:` e `wa.me` abrem aplicativos. Não há confirmação automática de contato, entrega, leitura ou pagamento.
6. **Cinco anos não é autorização para negativar:** o dashboard classifica vencimentos por tempo. Esse recorte não decide exigibilidade, prescrição ou elegibilidade jurídica para protesto/negativação.

## Prioridades para evoluir a demonstração

### 1. Fechar a operação por contrato

Reutilizar o módulo Cobrança e seus serviços. Primeiro preservar `debtId` e identidade do operador nos novos atendimentos; depois responsabilidade, tomada e transferência, encerramento no contrato correto e agenda de retornos/promessas. Definir a identidade demonstrativa de cada operador antes de representar uma equipe.

Critérios: dois contratos da mesma pessoa/credor mantêm encerramentos independentes; histórico antigo permanece legível sem atribuição retroativa; toda transferência possui origem, destino, motivo, autor e data; duas abas não assumem o mesmo atendimento; permissão e contexto são revalidados na mutação.

### 2. Construir régua com execução apenas simulada

Estender Campanhas com jornadas persistidas por credor, etapas e condições. O motor de simulação deve explicar quem seria incluído/excluído, quando e por qual motivo. Cobrir suspensão, contestação, bloqueio, acordo, frequência e horários definidos. Separar os eventos previstos dos efetivamente realizados.

Critérios: executar novamente não duplica eventos simulados; mudanças de elegibilidade são revalidadas; pausa/retomada é auditada; nenhum evento é apresentado como mensagem entregue. Canais sem provedor habilitado permanecem identificados como indisponíveis.

### 3. Evoluir extração e gestão

Reutilizar relatórios e medidas existentes, com seleção de campos/grupos permitidos, filtros e visões salvas. Acrescentar desempenho por operador apenas depois de existir atribuição confiável no atendimento.

Critérios: o total exportado fecha com o filtro e o gráfico; percentuais usam numerador/denominador explícitos; agregações não duplicam dívidas e parcelas; bases vazias e localização ausente permanecem identificadas; exportação continua neutralizando fórmulas.

### 4. Modelar os módulos especializados

Planejar separadamente assessorias, portal, instrumentos financeiros, restrições e voz. Cada fluxo demonstrativo deve ter estados e transições verificáveis, sem acionar serviços reais. Não criar apenas cartões de navegação ou botões sem operação completa.

Critérios específicos:

- **Assessorias:** cadastro distinto de credor; atribuição/devolução com vigência, responsável e histórico, sem reescrever titularidade da dívida.
- **Portal:** navegação externa separada, sessão independente, escopo da pessoa e empresa, elegibilidade revalidada no aceite e estados de erro/expiração.
- **Pagamentos:** instrumentos fictícios claramente identificados; nenhuma quitação sem confirmação explícita e referência única; divergência não quita parcela. Confirmação oficial fica para a integração real.
- **Restrições:** dossiê e quarentena com motivo, responsáveis, prazos e decisões; nenhuma transmissão a birô/cartório. Não usar bloqueio operacional como registro de negativação.
- **Voz:** fluxo de URA e estados de chamada simulados; não apresentar gravação, chamada completada ou atendimento humano inexistente.

## Padrões obrigatórios nas futuras entregas

Seguir [AGENTS.md](../AGENTS.md), [arquitetura](architecture.md), [regras de negócio](business-rules.md) e [Enterprise Compact](standards/ui-ux.md): reutilizar entidades e serviços responsáveis; React/TypeScript/Styled-components; tokens semânticos; acessibilidade, teclado e mobile; dinheiro em centavos e datas de domínio; uma base demonstrativa; transação, validação, auditoria e invalidação da consulta; contexto e permissões revalidados nos serviços; compatibilidade dos dados antigos e segurança financeira preservadas.

Para produção, permanecem necessárias identidade/autorização no servidor, armazenamento centralizado, auditoria durável, contratos de provedores, escopos por empresa/equipe, confirmação financeira oficial, observabilidade e restauração de backups. A restrição de elegibilidade Meta registrada anteriormente continua pendente; não houve nova verificação da política nesta validação.

## Prova executada e limites

- Inspeção do código atual, contratos de entidades, roteamento e documentação, cobrindo as nove capacidades.
- `npm.cmd test`: **84 testes aprovados em 12 arquivos**, executados nesta validação. Eles comprovam as regras cobertas; não comprovam funcionalidades ausentes ou integração externa.
- Build, lint e 13 testes de navegador da entrega imediatamente anterior continuam como evidência daquela versão; não foram reexecutados nesta revisão documental, pois não houve alteração de código de produto.
- Nenhum recurso ausente foi declarado implementado. As prioridades e critérios acima são propostas de evolução, não uma ativação de produção.
