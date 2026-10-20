export const topics = [
  {
    path: '/',
    question: 'Como analisar os indicadores?',
    terms: ['dashboard', 'indicador', 'kpi', 'vencid', 'vencer', 'cidade', 'cinco anos', '5 anos'],
    answer:
      'No Dashboard, consulte Carteira e território para vencimentos, faixas de atraso e distribuição por cidade. Dívidas vencidas há menos de cinco anos são classificadas pelo vencimento, não pelo cadastro. Confira as definições dos KPIs nos botões de ajuda e o contexto dos filtros. Na aba de recuperação, recebido considera pagamentos confirmados; promessa não é recebimento.',
  },
  {
    path: '/devedores',
    question: 'Como consultar um contribuinte?',
    terms: ['devedor', 'contribuinte', 'cadastro', 'telefone', 'email', 'localizacao', 'canal'],
    answer:
      'Em Devedores, localize a pessoa e abra sua ficha. Ela reúne cadastro, canais de contato, histórico, dívidas e acordos. Use Editar canais ou Editar localização para corrigir os dados. O perfil Financeiro pode consultar, mas não editar esses dados.',
  },
  {
    path: '/cobranca',
    question: 'Como registrar um atendimento?',
    terms: ['atendimento', 'atender', 'contato', 'cobranca', 'observacao'],
    answer:
      'Na Operação de cobrança, selecione o contrato e use Registrar atendimento. Informe canal, resultado e observações. Retornos e promessas exigem data de hoje ou futura; promessa também exige valor positivo. Eles geram uma tarefa de acompanhamento. Bloqueios, contestações e suspensões podem impedir a operação. Financeiro não registra atendimentos.',
  },
  {
    path: '/negociacoes',
    question: 'Como negociar uma dívida?',
    terms: ['negoci', 'desconto', 'parcela', 'proposta', 'aprovacao'],
    answer:
      'Em Negociações, selecione uma dívida elegível, informe as condições e revise a simulação. Condições acima do limite automático exigem aprovação do Administrador, dentro da política máxima. A aprovação ainda exige aceite explícito. Bloqueio, contestação, suspensão ou acordo não cancelado podem impedir uma nova negociação.',
  },
  {
    path: '/acordos',
    question: 'Onde consultar os acordos?',
    terms: ['acordo', 'cancelamento', 'cronograma'],
    answer:
      'Em Acordos, abra Consultar para conferir situação, parcelas e histórico. Um acordo só fica cumprido quando todas as parcelas têm recebimento confirmado. Cancelamento exige Administrador e ausência de recebimentos; não apaga o histórico. Atraso e rompimento não liberam automaticamente uma nova negociação.',
  },
  {
    path: '/financeiro',
    question: 'Como confirmar um recebimento?',
    terms: ['financeiro', 'pagamento', 'recebimento', 'concili', 'pago', 'pix', 'boleto'],
    answer:
      'No Financeiro, Administrador ou Financeiro podem conciliar uma parcela aberta. Informe valor e referência única e confirme explicitamente. Valor divergente mantém a parcela aberta. Promessa e tarefa concluída não quitam dívidas. Nesta demonstração, não há emissão real de Pix ou boleto, nem movimentação de dinheiro.',
  },
  {
    path: '/tarefas',
    question: 'Como acompanhar os retornos?',
    terms: ['tarefa', 'retorno', 'promessa', 'agenda'],
    answer:
      'Em Tarefas, acompanhe retornos e promessas gerados nos atendimentos. Consulte prazo, responsável e contrato antes de agir. Concluir uma tarefa registra o acompanhamento; não registra contato nem confirma pagamento. Para isso, use Atendimento ou Financeiro, conforme sua permissão.',
  },
  {
    path: '/conversas',
    question: 'O sistema envia mensagens?',
    terms: ['conversa', 'whatsapp', 'mensage', 'enviar', 'meta', 'chat'],
    answer:
      'Conversas reúne WhatsApp, e-mail e SMS em um histórico por pessoa e empresa. Permite salvar rascunhos e simular envio ou falha; o envio está desabilitado. A integração Meta ainda não está ativa. Os botões de canal na ficha abrem o aplicativo externo quando há um destino válido e a operação é permitida. Registre depois o resultado do contato. O assistente também não envia mensagens.',
  },
  {
    path: '/carteiras',
    question: 'Como importar uma carteira?',
    terms: ['import', 'csv', 'carteira', 'arquivo'],
    answer:
      'Em Carteiras, consulte a carteira e a opção de importação. Use o modelo CSV disponível, dados fictícios com documentos DEMO-..., até 1 MB e 1.000 registros. Revise os erros antes de confirmar: se um registro for inválido, o lote inteiro é rejeitado para evitar importação parcial.',
  },
  {
    path: '/reguas',
    question: 'Como funcionam as réguas?',
    terms: ['regua', 'campanha', 'automacao'],
    answer:
      'Réguas de cobrança organizam as etapas demonstrativas de acompanhamento. Campanhas selecionam um público elegível para simulação. Nenhuma delas envia mensagens reais. Confira os critérios e bloqueios antes de simular uma operação.',
  },
  {
    path: '/relatorios',
    question: 'Como consultar os relatórios?',
    terms: ['relatorio', 'export', 'resultado'],
    answer:
      'Em Relatórios, selecione o assunto e ajuste os filtros. Cada leitura usa sua data correspondente: vencimento, atendimento, criação ou recebimento. A exportação CSV respeita os dados filtrados. Valores negociados e recebidos representam métricas diferentes.',
  },
  {
    path: '/devedores',
    question: 'Como suspender uma cobrança?',
    terms: ['suspend', 'suspens', 'bloque', 'retomar', 'liberar'],
    answer:
      'Na ficha do contribuinte, use Suspender cobrança na linha do contrato e informe o motivo. Retomar cobrança também mantém registro no histórico. A suspensão é por contrato; Bloquear operação afeta a pessoa inteira. Essas ações não apagam acordos nem recebimentos e não estão disponíveis ao Financeiro.',
  },
];

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

export function answerQuestion(question: string) {
  const normalized = normalize(question);
  const ranked = topics
    .map((topic) => ({
      topic,
      score: topic.terms.filter((term) => normalized.includes(term)).length,
    }))
    .sort((a, b) => b.score - a.score);
  const match = ranked[0];
  if (!match?.score)
    return {
      text: 'Não encontrei uma orientação segura na base local. Pergunte sobre uma funcionalidade, como atendimento, negociação, indicadores ou recebimentos, ou escolha uma das sugestões. Não consulto dados da carteira nem executo operações.',
    };
  return { text: match.topic.answer, path: match.topic.path };
}

export function suggestedQuestions(pathname: string) {
  const current = topics.find((topic) =>
    topic.path === '/' ? pathname === '/' : pathname.startsWith(topic.path),
  );
  return [
    ...new Set(
      [current?.question, topics[2].question, topics[0].question].filter(
        (question): question is string => Boolean(question),
      ),
    ),
  ];
}
