# Padrão operacional aprovado

Direção aprovada pelo usuário em 20/10/2026 a partir das referências de tarefas, indicadores, réguas e conversas. Aplicada ao sistema React existente, com identidade Gamma e Enterprise Compact.

## Organização visual

- Navegação com nomes visíveis, azul-marinho Gamma e verde semântico, recolhível pelo usuário. Cabeçalho de página com um título e ações proporcionais.
- Abas para trabalhos distintos ou estados de uma lista, sem concentrar todas as análises em uma página extensa. Indicadores separam **Carteira e território** de **Recuperação e operação**. O período continua pertencendo à análise financeira de recuperação.
- Tabelas compactas para trabalho em volume, seleção explícita e painel de detalhes no contexto. No celular, colunas viram blocos e tabelas conservam rolagem interna.
- Réguas exibem etapas relativas ao vencimento, canal e ação. Não usar cor como única indicação de estado. O editor conserva validação, erros e cancelamento explícitos.
- Conversas mantêm lista, rascunho e contexto do contrato juntos em telas amplas. Em telas menores, o contexto fica abaixo. Rascunhos são identificados como locais; envio segue desabilitado.
- Reutilizar componentes, tokens e foco/teclado existentes. Não copiar nomes, logotipos ou paleta de fornecedores. Não acrescentar robô decorativo ou indicadores sem fonte.

## Tarefas implementadas

Rota `/tarefas`, sob o guard administrativo. Lista por empresa, busca por pessoa/contrato/ação/responsável, filtro **Somente minhas** e abas Todas, Hoje, Atrasadas, Futuras e Concluídas. A tarefa aponta para uma dívida existente e guarda título, prazo, autor/responsável demonstrativo e instante de criação. Administrador/Operador podem criar e concluir; Financeiro consulta.

O responsável é o nome do perfil demonstrativo que criou o registro. Não existe provisão de usuários reais, delegação, transferência ou exclusão mútua de posse de atendimento. Concluir tarefa é uma decisão explícita, auditada, revalidada na transação e recusada em uma segunda conclusão concorrente. Não fecha atendimento, cancela acordo ou confirma pagamento.

Novos atendimentos com Retorno agendado ou Promessa de pagamento criam a tarefa na mesma transação do contato. O campo `sourceContactId` mantém a origem. A data do contato representa o evento histórico; a tarefa acompanha a conclusão da próxima ação. Dados antigos não geram tarefas retroativas.

## Vínculo dos atendimentos

Novos contatos preservam `debtId` e `actor`. Novos encerramentos retiram apenas o contrato correspondente da fila. Registros antigos sem contrato mantêm sua abrangência original de pessoa/credor, sem atribuir contrato artificialmente ou reabrir silenciosamente a operação. O histórico permanece disponível e o relatório de produtividade passa a incluir contrato e operador, identificando os campos desconhecidos do legado.

## Réguas implementadas

Rota `/reguas`, sob o guard administrativo. Administrador pode cadastrar e editar por empresa, com 1–10 etapas e dias de −90 a +365 relativamente ao vencimento. Canais: E-mail, WhatsApp, Telefone e Tarefa interna. O nome e cada ação têm validação. Não é permitido repetir um canal no mesmo dia da régua. As etapas são ordenadas por dia no salvamento. A régua pode ser pausada no editor. Leitores Operador/Financeiro consultam.

Cada salvamento incrementa a revisão e exige a revisão esperada ao editar, recusando atualização de uma tela desatualizada. Não permite mover uma régua entre empresas. A simulação lê a base atual dentro da transação e classifica cada etapa/contrato. Motivos de exclusão: régua pausada, carteira inativa, bloqueio/suspensão/contestação, acordo não cancelado, etapa anterior ao dia da simulação ou canal sem destino utilizável.

O histórico preserva data, ator, revisão e resultado por contrato/etapa, incluindo canal, texto da ação e data prevista. É uma fotografia da simulação, não um sinal de elegibilidade atual. Repetir no mesmo dia, na mesma revisão e com o mesmo resultado reaproveita a simulação; uma mudança de base/revisão gera outra fotografia. Cliques continuam auditados. O simulador não envia mensagens, cria tarefas, registra atendimentos ou recebe pagamentos. Não há agendador em segundo plano, execução de canais, limites de custo/frequência ou regras de horário habilitadas.

## Persistência e compatibilidade

`tasks`, `journeys` e `journeyRuns` são coleções opcionais da versão 1; contatos antigos aceitam ausência de `debtId`/`actor`. Leituras não preenchem nem alteram a base. Mutações passam pelos serviços, validação, `transact`, auditoria e invalidação TanStack Query/BroadcastChannel. Campos de vínculo e empresa são verificados pelo schema e pelos serviços.

Não executar builds antigos e novos simultaneamente: leitores antigos podem descartar campos desconhecidos ao gravar. Preservar cópia IndexedDB antes de qualquer rollback. Não é necessário restaurar a demonstração; os novos módulos iniciam vazios e podem ser preenchidos pela interface.

## Verificação

Testes de domínio cobrem tarefas a partir de contatos, conclusão concorrente, escopos/perfis, preservação de legado, referências inválidas, ausência de baixa financeira, idempotência da simulação, pausa por suspensão, indisponibilidade de canal e revisão concorrente. Testes no navegador exercitam formulários, filtros/abas, persistência após recarga, linha do tempo, pausa e layouts desktop/mobile; os fluxos anteriores permanecem verificados.
