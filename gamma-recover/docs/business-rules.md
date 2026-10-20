# Regras de negócio demonstrativas

## Valores e datas

Dinheiro é armazenado em centavos inteiros. O desconto é arredondado uma vez: `original - round(original × percentual / 100)`. A entrada deve ser não negativa e menor que o total. O restante é dividido em parcelas; centavos residuais ficam na última. A soma de entrada e parcelas deve ser exatamente igual ao total negociado. Vencimentos mensais limitam o dia ao último dia do mês. Hoje usa America/Sao_Paulo; comparação de datas usa AAAA-MM-DD.

Sem entrada, a primeira parcela vence hoje; com entrada, a entrada vence hoje e a primeira parcela vence no mês seguinte. Nenhuma delas é recebida automaticamente.

## Elegibilidade e políticas

Uma dívida requer carteira ativa, pessoa não bloqueada, ausência de contestação e ausência de qualquer acordo não cancelado. Acordos cumpridos e rompidos também impedem nova negociação automática. Não há sobreposição de acordos para um contrato.

Cada credor configura desconto máximo, limite de aprovação automática, máximo de parcelas e valor mínimo. Abaixo ou no limite automático, a proposta revisada fica Simulada e pode ser aceita. Acima dele e dentro do máximo, fica Aguardando aprovação. Somente o Administrador pode aprová-la; ela volta a Simulada, guarda o aprovador e ainda exige aceite explícito. Nenhuma aprovação ultrapassa o máximo do credor. Política, bloqueios e condições são revalidados no aceite, inclusive após uma aprovação anterior.

Cenário inicial: Horizonte permite 30%, automático até 20%, até 12 parcelas, mínimo R$ 50. Vértice permite 20%, automático até 10%, até 8 parcelas, mínimo R$ 80. Mudanças da política afetam novas simulações e aceites; não recalculam acordos já formalizados.

## Acordos

Estados: Cancelado e Rompido têm precedência; Cumprido exige todas as parcelas recebidas; Em atraso tem pelo menos uma parcela não paga anterior a hoje; Ativo tem cronograma sem atraso; Pendente representa acordo sem cronograma, embora o fluxo de criação sempre gere parcelas.

Cancelamento exige Administrador, ausência de qualquer recebimento e acordo não rompido/não cancelado. O histórico e parcelas são preservados, retirados da cobrança financeira ativa, e a dívida volta a ser elegível. Não há estorno neste frontend.

## Cobrança

Atendimentos exigem Operador ou Administrador. Permitem contato, tentativa sem contato, agendamento, promessa e encerramento. Data de retorno/promessa deve ser hoje ou futura; promessa exige valor positivo e não é recebimento. Observações têm de 5 a 2.000 caracteres. O prazo configurado sugere a data, editável pelo operador. Encerramento retira a pessoa/credor da fila demonstrativa; o cadastro e histórico continuam disponíveis.

Bloqueio global da pessoa impede contatos e negociações. Contestação do portal suspende contatos e negociações do contrato, preservando acordos e pagamentos anteriores; não altera automaticamente obrigações financeiras já registradas.

## Recebimentos e conciliação

Somente Administrador e Financeiro conciliam. A parcela deve estar aberta em acordo não cancelado/não rompido. Valor positivo e referência de pelo menos três caracteres são obrigatórios. Referência já usada em pagamento confirmado é recusada. Valor exato confirma recebimento fictício ao credor na data atual; valor diferente registra divergência e mantém a parcela não paga. Dupla confirmação é recusada. Divergência pode ser corrigida em nova conciliação.

Negociado = soma dos acordos não cancelados formalizados no período. Recebido = soma das parcelas explicitamente pagas no período, inclusive recebimentos anteriores de acordos rompidos. Vencido = parcelas abertas anteriores a hoje em acordos não cancelados/não rompidos. Elegível exclui bloqueios, contestações, carteiras inativas e acordos vigentes. Recuperação = recebido no período / saldo original atual dos contratos. A posição dos acordos é atual, independentemente do período de recebimento.

## Importação, campanhas e relatórios

CSV: UTF-8, até 1 MB e 1.000 registros; cabeçalho `documento;nome;contrato;valor;vencimento`. Valores em reais, com ponto ou vírgula decimal; datas ISO válidas. Documentos fictícios `DEMO-...`, referências de dívida únicas por empresa. Um documento existente deve ter o mesmo nome. Todo o lote é revertido se qualquer registro falhar, inclusive duplicidades na base.

Campanhas capturam o público elegível na criação, por credor e atraso mínimo. A simulação muda o estado e registra auditoria; conta contratos selecionados e zero envios, sem alegar comunicação ou conversão real.

Relatórios aplicam datas de criação, recebimento, vencimento ou atendimento conforme seu assunto. A posição de recuperação é calculada sobre a base atual. Exportação CSV preserva as linhas filtradas, escapa aspas e neutraliza prefixos de fórmulas. O comprovante de acordo é TXT explicitamente demonstrativo.

## Perfis e código legado do portal

Administrador gerencia cadastros, políticas, cobrança, aprovação, cancelamento e conciliação. Operador consulta, bloqueia, atende e negocia. Financeiro consulta e concilia. A troca livre entre os três usuários fictícios existe somente para explorar a demonstração.

O portal está fora do escopo inicial, sem rotas ou links disponíveis. As regras abaixo descrevem apenas seu código preservado para uma possível retomada.

Portal usa pessoa fictícia escolhida, código público 123456 e sessão de 30 minutos no navegador. Rotas exigem sessão; consultas e mutações verificam o devedor. A sessão expirada deixa de permitir mutações e redireciona para acesso. Não implementa autenticação efetiva, envio de códigos, contestação externa ou pagamentos.

## Definições adicionais de apresentação do dashboard

Sem alteração das regras financeiras anteriores:

- Janela selecionada: início do mês atual ou dos últimos 3/6 meses, até hoje. Todo o histórico começa no primeiro evento datado disponível. Comparação usa a janela imediatamente anterior, com igual número de dias, sem sobreposição. Séries agrupam datas e mostram o intervalo de cada ponto no tooltip; as janelas anteriores são alinhadas por deslocamento em dias.
- Recuperação e negociado mostram variação percentual apenas quando há registros anteriores e denominador positivo. Todo o histórico não apresenta comparação. Saldo administrado, elegível, quantidade de ativos e inadimplência são posições atuais sem snapshots; não recebem comparação inventada.
- Inadimplência dos acordos = Em atraso / (Ativos + Em atraso). Rompidos, cumpridos, pendentes e cancelados são discriminados no gráfico de situações. Sem acordos em acompanhamento, mostrar travessão.
- Eficiência operacional = atendimentos com Contato realizado, Retorno agendado ou Promessa de pagamento / todos os atendimentos registrados no período. Tentativas repetidas contam separadamente. Comparação, quando houver atendimentos nas duas janelas, é expressa em pontos percentuais. Não mede recebimento nem conversão financeira.
- Cobertura: pessoas únicas na carteira, acionadas no período, com contato efetivo e interseção destas últimas com pessoas com acordo formalizado no período. O funil não atribui causalidade nem apresenta acordos sem atendimento como conversões da cobrança.
- Pendências de conciliação representam divergências explícitas em parcelas abertas de acordos não cancelados/não rompidos. Parcela ainda não paga, por si só, não é uma divergência. Próximos vencimentos consideram hoje até sete dias à frente, excluindo itens pagos e acordos cancelados/rompidos. Aprovações pendentes usam o estado atual da proposta.
- Contatos ISO com horário são agrupados por data em America/Sao_Paulo. Recebimentos e formalizações preservam suas datas de domínio. Cancelamentos e bloqueios mantêm as mesmas regras de elegibilidade anteriores.

## Empresa contratante e contrato de serviços

A empresa contratante é o credor das carteiras. Seu cadastro e política são editáveis somente pelo Administrador e respeitam o contexto selecionado. Documento fictício não pode se repetir. O perfil completo exige contato responsável, telefone, e-mail válido e responsável interno. Se houver fim de vigência, deve existir início e o fim não pode antecedê-lo. O anexo é opcional e limitado a PDF de até 2 MB.

Carteira exige empresa existente; não pode ser transferida para outra empresa. Importar exige carteira ativa e pertencente ao contexto. A referência de contrato de dívida é única dentro da empresa, mesmo entre carteiras, e pode se repetir em outra empresa. Pessoas são identificadas pelo documento fictício compartilhado, conservando suas dívidas em vínculos separados. Importações guardam o operador e mantêm a associação pela carteira.

O contrato de serviços descreve a contratação da Gamma. Vigência e condições comerciais não alteram acordos, parcelas, pagamentos, comissões ou repasses automaticamente. Não confundir esse contrato com o contrato de dívida importado.

## Canais e atendimento manual

Administrador e Operador podem atualizar os canais de uma pessoa a partir de uma dívida válida no contexto. O telefone deve ter DDD brasileiro; WhatsApp requer cadastro explícito. O canal preferencial deve ter destino utilizável. Preferência não é confirmação de titularidade, consentimento ou entrega. O perfil Financeiro consulta os dados, sem iniciar contato nem editar canais. Um bloqueio impede contato, mas permite corrigir o cadastro.

Atendimento por WhatsApp, Telefone ou E-mail exige destino utilizável na transação e continua sujeito a bloqueios e contestação. O destino é copiado para o histórico, preservando a tentativa mesmo se o cadastro for alterado posteriormente. O resultado é declarado manualmente pela equipe. Abrir o aplicativo não confirma contato, envio, leitura, promessa ou recebimento. Registros internos não atribuem canal externo; registros legados não recebem canal inferido.
