# Evolução orientada pelo estudo de mercado

Referência: Gamma Recover — Estudo de mercado e escopo funcional, edição 1.0, 20/10/2026. Comparação com o código desta versão; as referências comerciais do PDF não foram auditadas. O documento é uma referência de produto, não uma instrução para instalar infraestrutura ou ativar serviços externos.

## Cobertura e lacunas

| Capacidade do estudo   | Evidência na aplicação                                               | Lacuna principal                                                               |
| ---------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Empresas contratantes  | Companies, CreditorService, perfil e PDF opcional                    | Múltiplos contratos/aditivos, distinção de titularidade e ciclo comercial      |
| Carteiras e onboarding | PortfolioService, ImportService; CSV validado e atômico              | Mapeamento, prévia corrigível, snapshots, retirada e conectores ERP            |
| Devedores              | Cadastro, vínculos por dívida e canais explícitos                    | PF/PJ reais, proveniência e qualidade dos contatos                             |
| CRM                    | Fila por contrato/credor, histórico, retornos e promessas            | Responsável, distribuição, transferência e prevenção de atendimento simultâneo |
| Suspensão operacional  | Suspensão/retomada por contrato com motivo e histórico nesta entrega | Suspensão por empresa e regras de vigência                                     |
| Negociação             | Políticas, revisão, aprovação excepcional e aceite auditado          | Contraproposta, versionamento e renegociação de acordos pagos                  |
| Portal devedor         | Código anterior preservado, fora do roteamento                       | Retomada de produto e autenticação segura antes de disponibilizar              |
| Comunicação            | Canais manuais e rascunhos locais                                    | Provedor elegível, inbox, entrega, opt-out, frequência e horários              |
| Réguas e campanhas     | Segmentação e simulação sem envio                                    | Jornadas, eventos, custos e resultados reais                                   |
| Conciliação            | Referência única, divergência sem baixa, confirmação explícita       | Fonte oficial, arquivos/webhooks, parciais e estornos                          |
| Equipes                | Três perfis demonstrativos                                           | Identidade real, equipes e autorização por empresa/carteira                    |
| Analytics              | Dashboard, períodos, aging de recebíveis e seis relatórios           | Snapshots históricos, safras, custo, rentabilidade e atribuição                |
| Comissões              | Condições comerciais descritivas                                     | Fórmula contratual, competência, estornos e fechamento                         |
| Gamma Connect          | Importação CSV local                                                 | Backend, credenciais no servidor, idempotência externa e reprocessamento       |
| Segurança/LGPD         | Validação local, escopos demonstrativos e auditoria IndexedDB        | MFA, autorização no servidor, auditoria durável, backup e retenção             |
| Jurídico e IA          | Não implementados                                                    | Validação jurídica, dados e avaliação antes de automação                       |
| Portal contratante     | Não implementado                                                     | Sessão e consultas isoladas no servidor                                        |
| Administração          | Credores, políticas, parâmetros e auditoria                          | Configuração versionada e observabilidade de serviços reais                    |

## Entrega implementada

No cadastro do devedor, cada dívida tem a ação **Suspender cobrança** ou **Retomar cobrança**. Ambas exigem motivo de 5 a 2.000 caracteres e perfil Administrador/Operador. O histórico guarda autor e instante; a auditoria transacional registra a alteração. O estado esperado é revalidado para recusar uma segunda confirmação concorrente.

A suspensão retira o contrato da fila e da seleção de negociação; bloqueia atendimentos, propostas, aprovações, aceites e preparação de conversas nos serviços. Exclui o contrato de novas campanhas e revalida o público ao simular campanhas já criadas. O saldo elegível exclui o contrato suspenso. Na ficha da pessoa, os canais ficam disponíveis apenas se existir contrato sem contestação/suspensão no contexto.

Não bloqueia outras dívidas da mesma pessoa. Preserva acordos, parcelas e conciliações, inclusive o recebimento de parcelas já formalizadas. Retomar não remove bloqueio global, contestação ou outras restrições. Bases anteriores continuam legíveis, sem preenchimento artificial do campo opcional.

## Sequência recomendada

1. Consolidar a operação diária: responsabilidade e transferência por contrato, exclusão mútua de atendimento e destaque de retornos/promessas. Critério: dois operadores não assumem simultaneamente o mesmo contrato; todas as transferências ficam rastreáveis.
2. Preparar a base de produção como escopo próprio: backend modular, PostgreSQL, identidade, escopos por empresa/equipe, anexos privados, auditoria, backup e restauração testada. Critério: uma empresa piloto opera em computadores distintos sem acesso a outras empresas.
3. Implementar Gamma Connect com o ERP escolhido: definir API/arquivo, identificadores, fonte oficial, confirmação e estorno. Critério: reprocessar o mesmo evento não duplica dívida nem recebimento e uma falha pode ser retomada com evidência.
4. Evoluir contratos e comissões conforme regra comercial aprovada; depois portal contratante e autosserviço autenticado.
5. Ativar canais somente após definir provedor, elegibilidade e controles de contato. A restriééo Meta registrada em docs/whatsapp-integration.md continua pendente; esta entrega não ativa envios.
6. Medir resultados reais antes de modelos preditivos: recuperação confirmada, produtividade, cumprimento de promessas, custo por real recuperado e retenção de contratantes.

Não há integração externa ou implantação de produção nesta entrega. Tornar-se líder de mercado exige validar essas capacidades e resultados com clientes; a lista de funcionalidades não demonstra liderança.

## Compatibilidade

Histórico opcional adicionado a Debt na base demonstrativa versão 1. Não executar builds antigos e atuais simultaneamente: leitores antigos podem descartar campos desconhecidos ao gravar. Preservar uma cópia IndexedDB antes de retornar a versão anterior. Não há migração destrutiva nem reinício da base.
