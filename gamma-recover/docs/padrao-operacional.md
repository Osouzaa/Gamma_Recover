# Padrão operacional aprovado

Direção aprovada pelo usuário em 20/10/2026 a partir das referências de tarefas, indicadores, réguas e conversas. Aplicada ao sistema React existente, com identidade Gamma e Enterprise Compact.

## Organização visual

- Navegação com nomes visíveis, azul-marinho Gamma e verde semântico, recolhível pelo usuário. Cabeçalho de página com um título e ações proporcionais.
- Abas para trabalhos distintos ou estados de uma lista, sem concentrar todas as análises em uma página extensa. Indicadores separam **Carteira e território** de **Recuperação e operação**. O período continua pertencendo à análise financeira de recuperação.
- Tabelas compactas para trabalho em volume, seleção explícita e painel de detalhes no contexto. No celular, colunas viram blocos e tabelas conservam rolagem interna.
- Réguas exibem etapas relativas ao vencimento, canal e ação. Não usar cor como única indicação de estado. O editor conserva validação, erros e cancelamento explícitos.
- Conversas mantêm lista, rascunho e contexto do contrato juntos em telas amplas. Em telas menores, o contexto fica abaixo. Rascunhos são identificados como locais; envio real segue desabilitado. O histórico reúne WhatsApp, e-mail e SMS, com simulações explícitas.
- Reutilizar componentes, tokens e foco/teclado existentes. Não copiar nomes, logotipos ou paleta de fornecedores. Não acrescentar robô decorativo ou indicadores sem fonte.

## Tarefas implementadas

Rota `/tarefas`, sob o guard administrativo. Lista por empresa, busca por pessoa/contrato/ação/responsável, filtro **Somente minhas** e abas Todas, Hoje, Atrasadas, Futuras e Concluídas. A tarefa aponta para uma dívida existente e guarda título, prazo, autor/responsável demonstrativo e instante de criação. Administrador/Operador podem criar e concluir; Financeiro consulta.

O responsável é o nome do perfil demonstrativo que criou o registro. Não existe provisão de usuários reais, delegação, transferência ou exclusão mútua de posse de atendimento. Concluir tarefa é uma decisão explícita, auditada, revalidada na transação e recusada em uma segunda conclusão concorrente. Não fecha atendimento, cancela acordo ou confirma pagamento.

Novos atendimentos com Retorno agendado ou Promessa de pagamento criam a tarefa na mesma transação do contato. O campo `sourceContactId` mantém a origem. A data do contato representa o evento histórico; a tarefa acompanha a conclusão da próxima ação. Dados antigos não geram tarefas retroativas.

## Vínculo dos atendimentos

A operação de cobrança usa uma fila de casos à esquerda e a ficha selecionada à direita, substituindo a tabela acima dos detalhes. Cada item informa pessoa, contrato, empresa, valor original e vencimento. A fila tem busca e ordenação por vencimento, nome ou valor; a lista rola internamente. Em telas menores, a fila fica acima e selecionar um contrato leva à ficha.

A ficha mostra um resumo do contrato e separa **Contato**, **Histórico** e **Tarefas** em abas. **Registrar atendimento** é a ação principal: abre o formulário no contexto e recolhe os canais. Salvar leva ao histórico; cancelar retorna aos canais. Alternar as abas preserva o texto não salvo. Retornos e promessas continuam criando tarefas na mesma transação. É possível criar uma tarefa com o contrato já selecionado e concluir pendências sem sair da ficha. Concluir tarefa não registra contato nem recebimento.

A busca aceita nome, documento, contrato e empresa. Busca, ordenação e seleção explícita ficam na URL e sobrevivem à recarga ou ao retorno pelo navegador. O histórico principal mostra apenas o contrato selecionado; registros antigos sem contrato ficam em uma seção identificada, sem atribuição retroativa. Cancelar um atendimento alterado, trocar a empresa ou navegar para outra rota exige confirmação de descarte; recarregar com alterações usa o aviso nativo do navegador.

Novos contatos preservam `debtId` e `actor`. Novos encerramentos retiram apenas o contrato correspondente da fila. Registros antigos sem contrato mantêm sua abrangência original de pessoa/credor, sem atribuir contrato artificialmente ou reabrir silenciosamente a operação. O histórico permanece disponível e o relatório de produtividade passa a incluir contrato e operador, identificando os campos desconhecidos do legado.

## Réguas implementadas

Rota `/reguas`, sob o guard administrativo. Administrador pode cadastrar e editar por empresa, com 1–10 etapas e dias de −90 a +365 relativamente ao vencimento. Canais: E-mail, WhatsApp, Telefone e Tarefa interna. O nome e cada ação têm validação. Não é permitido repetir um canal no mesmo dia da régua. As etapas são ordenadas por dia no salvamento. A régua pode ser pausada no editor. Leitores Operador/Financeiro consultam.

Cada salvamento incrementa a revisão e exige a revisão esperada ao editar, recusando atualização de uma tela desatualizada. Não permite mover uma régua entre empresas. A simulação lê a base atual dentro da transação e classifica cada etapa/contrato. Motivos de exclusão: régua pausada, carteira inativa, bloqueio/suspensão/contestação, acordo não cancelado, etapa anterior ao dia da simulação ou canal sem destino utilizável.

O histórico preserva data, ator, revisão e resultado por contrato/etapa, incluindo canal, texto da ação e data prevista. É uma fotografia da simulação, não um sinal de elegibilidade atual. Repetir no mesmo dia, na mesma revisão e com o mesmo resultado reaproveita a simulação; uma mudança de base/revisão gera outra fotografia. Cliques continuam auditados. O simulador não envia mensagens, cria tarefas, registra atendimentos ou recebe pagamentos. Não há agendador em segundo plano, execução de canais, limites de custo/frequência ou regras de horário habilitadas.

## Persistência e compatibilidade

`tasks`, `journeys` e `journeyRuns` são coleções opcionais da versão 1; contatos antigos aceitam ausência de `debtId`/`actor`. Leituras não preenchem nem alteram a base. Mutações passam pelos serviços, validação, `transact`, auditoria e invalidação TanStack Query/BroadcastChannel. Campos de vínculo e empresa são verificados pelo schema e pelos serviços.

Não executar builds antigos e novos simultaneamente: leitores antigos podem descartar campos desconhecidos ao gravar. Preservar cópia IndexedDB antes de qualquer rollback. Não é necessário restaurar a demonstração; os novos módulos iniciam vazios e podem ser preenchidos pela interface.

## Negociação em etapas

A aba **Nova negociação** conduz por Escolher contrato, Montar proposta e Confirmar acordo. Ao abrir pelo contrato na cobrança, a escolha já está feita e o fluxo começa nas condições. Um contrato indicado no link que não esteja elegível não é substituído silenciosamente; a tela permite escolher outro.

O operador ajusta desconto, entrada e parcelas com resumo calculado pelo serviço de domínio. Revisar proposta salva as condições e abre a confirmação, ocultando os campos de edição. Alterar condições volta à montagem e exige nova revisão e novo aceite. A confirmação só fica disponível com aceite explícito; propostas acima do limite automático aguardam aprovação e oferecem acesso ao histórico. Aprovação, política máxima, bloqueios e criação do acordo permanecem nos serviços existentes.

O **Histórico de propostas** fica em aba separada, com aprovação e retomada. Retomar abre a proposta salva na confirmação e reinicia o aceite, inclusive ao retomar a mesma proposta. Financeiro consulta o histórico. Alternar abas ou voltar à escolha preserva as condições; trocar efetivamente o contrato, retomar outra proposta, trocar a empresa ou sair com condições não revisadas exige confirmação de descarte. Revisões já salvas continuam no histórico. A formalização abre Acordos e não confirma recebimentos.

## Verificação

Testes de domínio cobrem tarefas a partir de contatos, conclusão concorrente, escopos/perfis, preservação de legado, referências inválidas, ausência de baixa financeira, idempotência da simulação, pausa por suspensão, indisponibilidade de canal e revisão concorrente. Testes no navegador exercitam formulários, filtros/abas, persistência após recarga, linha do tempo, pausa e layouts desktop/mobile; os fluxos anteriores permanecem verificados.

## Assistente flutuante

O painel administrativo oferece o botão Assistente no canto inferior direito. O diálogo tem perguntas sugeridas conforme a rota, campo de dúvidas, atalhos e limpeza de conversa. A base local orienta sobre os fluxos implementados; não utiliza IA generativa, não consulta registros e não executa mutações. Perguntas não reconhecidas recebem uma mensagem de limite, sem respostas inventadas. A conversa fica somente na memória do painel, limitada às últimas 40 mensagens, e termina ao sair da sessão ou recarregar. Não há API externa nem chaves no frontend. Escape fecha o diálogo e devolve o foco ao botão; telas pequenas mantêm rolagem interna.

## Central multicanal demonstrativa

O editor mantém o campo de mensagem e, em e-mail, o assunto. O botão **Opções da mensagem** reúne canal, contrato e modelo em um modal; o canal e o contrato atuais aparecem em um resumo compacto. Trocar o canal abre a conversa correspondente e fecha o modal. Escolher um modelo preenche o texto editável e retorna ao editor. O contrato escolhido atualiza o contexto. As seleções são imediatas; Concluir, Escape e Fechar encerram o modal. Texto ou edição em andamento continuam impedindo a troca de canal/contrato e a substituição por modelo, preservando o conteúdo.

Conversas agrupa registros por contribuinte e empresa, com busca por nome/empresa/destino e filtro por canal. O painel mantém histórico cronológico dos três canais, com destino preservado, contrato, autor, assunto quando e-mail e estado escrito. O contexto apresenta acordos e a próxima tarefa pendente. Não existe atribuição de responsável por fila nesta etapa; o autor de cada mensagem é preservado.

Preparar conversa permite WhatsApp, E-mail ou SMS. O canal pode ser trocado após salvar ou descartar o texto atual. Modelos de apresentação e retorno preenchem conteúdo editável. E-mail exige assunto de até 150 caracteres e endereço utilizável; WhatsApp exige número explicitamente cadastrado; SMS usa o telefone cadastrado, exige celular brasileiro e limita o texto a 160 caracteres nesta demonstração. Segmentação, codificação e custos de SMS dependem de integração futura. Preferência de contato é exibida, sem representar consentimento.

Cada rascunho permite simular envio ou falha, por escolha explícita do operador. O registro é movido atomicamente para o histórico imutável de simulações; repetir a mesma solicitação reutiliza o resultado, sem duplicar mensagem. Não há entrega, leitura, resposta recebida, cobrança de provedor ou fallback automático. Falhas não são reenviadas automaticamente: o usuário precisa revisar e preparar outro rascunho. Não são criados atendimentos, tarefas nem recebimentos por simular. Financeiro consulta; Administrador/Operador operam com revalidação transacional de empresa, pessoa, contrato, destino e bloqueio/contestação/suspensão.

Compatibilidade: channel e simulations são opcionais; conversas antigas sem canal continuam sendo WhatsApp, sem regravar a base durante a leitura. Novos rascunhos aceitam subject opcional, obrigatório somente em e-mail. A unicidade agora inclui empresa, pessoa, canal e destino. Histórico de destinos antigos permanece consultável; mutações exigem destino atual. Os schemas validam também os contratos das simulações. Não executar builds anteriores simultaneamente, pois podem descartar campos novos; antes de rollback, preservar cópia IndexedDB e retornar a uma base compatível. Nenhuma exclusão ou restauração é necessária para atualizar.
