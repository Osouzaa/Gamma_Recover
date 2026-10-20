import type { Database } from '../types/domain';
import type { Conversation, MessageChannel, ChatSimulation } from '../types/conversations';
import { conversationChannel, messageDestination, messageLimit } from './messageChannels';
import { contactBlocked, creditorOf } from './domain';
import { chatTextSchema } from './conversationSchema';
import { requireDebt, requireRole, transact, type Scope } from './store';
import { id } from '../utils/format';
function requireContext(
  db: Database,
  scope: Scope,
  debtId: string,
  conversation?: Conversation,
  channel: MessageChannel = conversation ? conversationChannel(conversation) : 'WhatsApp',
) {
  requireRole(scope, ['Administrador', 'Operador'], db);
  const debt = requireDebt(db, scope, debtId);
  const debtor = db.debtors.find((d) => d.id === debt.debtorId)!;
  const creditorId = creditorOf(db, debt);
  if (contactBlocked(db, debt)) throw new Error('Contato bloqueado ou dívida contestada/suspensa.');
  const destination = messageDestination(debtor, channel);
  if (!destination)
    throw new Error('Cadastre um destino utilizável para o canal antes de preparar a conversa.');
  if (
    conversation &&
    (conversation.creditorId !== creditorId || conversation.debtorId !== debtor.id)
  )
    throw new Error('Contrato fora do contexto da conversa.');
  if (conversation && conversation.destination !== destination)
    throw new Error('O destino foi alterado. Abra uma nova conversa para o contato atual.');
  return { debt, debtor, creditorId, destination };
}
export const ConversationService = {
  open(scope: Scope, debtId: string, channel: MessageChannel = 'WhatsApp') {
    return transact('Conversa local preparada', debtId, scope, (db) => {
      const { debtor, creditorId, destination } = requireContext(
        db,
        scope,
        debtId,
        undefined,
        channel,
      );
      const conversations = (db.conversations ??= []);
      const existing = conversations.find(
        (c) =>
          c.debtorId === debtor.id &&
          c.creditorId === creditorId &&
          c.destination === destination &&
          conversationChannel(c) === channel,
      );
      if (existing) return existing.id;
      const now = new Date().toISOString();
      const conversation: Conversation = {
        id: id('cv'),
        debtorId: debtor.id,
        creditorId,
        destination,
        channel,
        createdAt: now,
        updatedAt: now,
        drafts: [],
      };
      conversations.push(conversation);
      return conversation.id;
    });
  },
  saveDraft(
    scope: Scope,
    conversationId: string,
    debtId: string,
    text: string,
    draftId?: string,
    subject = '',
  ) {
    return transact('Rascunho de mensagem salvo localmente', conversationId, scope, (db) => {
      const conversation = db.conversations?.find((c) => c.id === conversationId);
      if (!conversation) throw new Error('Conversa indisponível.');
      requireContext(db, scope, debtId, conversation);
      const value = chatTextSchema.parse(text);
      const channel = conversationChannel(conversation);
      if (value.length > messageLimit(channel))
        throw new Error('Mensagem acima do limite do canal.');
      if (channel === 'E-mail' && (!subject.trim() || subject.trim().length > 150))
        throw new Error('Informe um assunto de até 150 caracteres.');
      const emailSubject = channel === 'E-mail' ? subject.trim() : undefined;
      const now = new Date().toISOString();
      const existing = conversation.drafts.find((d) => d.id === draftId);
      if (draftId && !existing) throw new Error('Rascunho indisponível. Reabra a conversa.');
      if (existing && existing.debtId !== debtId)
        throw new Error('O contrato do rascunho não pode ser alterado.');
      if (existing)
        Object.assign(existing, {
          text: value,
          subject: emailSubject,
          updatedAt: now,
          actor: db.settings.operatorName,
        });
      else
        conversation.drafts.push({
          id: id('msg'),
          debtId,
          text: value,
          subject: emailSubject,
          actor: db.settings.operatorName,
          createdAt: now,
          updatedAt: now,
        });
      conversation.updatedAt = now;
    });
  },
  removeDraft(scope: Scope, conversationId: string, draftId: string) {
    return transact('Rascunho local removido', conversationId, scope, (db) => {
      const conversation = db.conversations?.find((c) => c.id === conversationId);
      const draft = conversation?.drafts.find((d) => d.id === draftId);
      if (!conversation || !draft) throw new Error('Rascunho indisponível.');
      requireContext(db, scope, draft.debtId, conversation);
      conversation.drafts = conversation.drafts.filter((d) => d.id !== draftId);
      conversation.updatedAt = new Date().toISOString();
    });
  },
  simulate(
    scope: Scope,
    conversationId: string,
    draftId: string,
    outcome: ChatSimulation['outcome'],
  ) {
    return transact('Envio de mensagem simulado localmente', conversationId, scope, (db) => {
      const conversation = db.conversations?.find((c) => c.id === conversationId);
      if (!conversation) throw new Error('Conversa indisponível.');
      const previous = conversation.simulations?.find((message) => message.id === draftId);
      const draft = conversation.drafts.find((message) => message.id === draftId);
      if (!draft && !previous) throw new Error('Rascunho indisponível.');
      requireContext(db, scope, (draft || previous)!.debtId, conversation);
      if (!['Envio simulado', 'Falha simulada'].includes(outcome))
        throw new Error('Resultado de simulação inválido.');
      if (previous) return previous.id;
      const now = new Date().toISOString();
      (conversation.simulations ??= []).push({
        ...draft!,
        outcome,
        actor: db.settings.operatorName,
        updatedAt: now,
      });
      conversation.drafts = conversation.drafts.filter((message) => message.id !== draftId);
      conversation.updatedAt = now;
      return draftId;
    });
  },
};
