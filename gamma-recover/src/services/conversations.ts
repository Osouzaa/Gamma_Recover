import type { Database } from '../types/domain';
import type { Conversation } from '../types/conversations';
import { contactDestination } from './contactChannels';
import { contactBlocked, creditorOf } from './domain';
import { chatTextSchema } from './conversationSchema';
import { requireDebt, requireRole, transact, type Scope } from './store';
import { id } from '../utils/format';
function requireContext(db: Database, scope: Scope, debtId: string, conversation?: Conversation) {
  requireRole(scope, ['Administrador', 'Operador'], db);
  const debt = requireDebt(db, scope, debtId);
  const debtor = db.debtors.find((d) => d.id === debt.debtorId)!;
  const creditorId = creditorOf(db, debt);
  if (contactBlocked(db, debt)) throw new Error('Contato bloqueado ou dívida contestada/suspensa.');
  const destination = contactDestination(debtor, 'WhatsApp');
  if (!destination)
    throw new Error('Cadastre um WhatsApp utilizável antes de preparar a conversa.');
  if (
    conversation &&
    (conversation.creditorId !== creditorId || conversation.debtorId !== debtor.id)
  )
    throw new Error('Contrato fora do contexto da conversa.');
  if (conversation && conversation.destination !== destination)
    throw new Error('O WhatsApp foi alterado. Abra uma nova conversa para o número atual.');
  return { debt, debtor, creditorId, destination };
}
export const ConversationService = {
  open(scope: Scope, debtId: string) {
    return transact('Conversa local preparada', debtId, scope, (db) => {
      const { debtor, creditorId, destination } = requireContext(db, scope, debtId);
      const conversations = (db.conversations ??= []);
      const existing = conversations.find(
        (c) =>
          c.debtorId === debtor.id && c.creditorId === creditorId && c.destination === destination,
      );
      if (existing) return existing.id;
      const now = new Date().toISOString();
      const conversation: Conversation = {
        id: id('cv'),
        debtorId: debtor.id,
        creditorId,
        destination,
        createdAt: now,
        updatedAt: now,
        drafts: [],
      };
      conversations.push(conversation);
      return conversation.id;
    });
  },
  saveDraft(scope: Scope, conversationId: string, debtId: string, text: string, draftId?: string) {
    return transact('Rascunho de WhatsApp salvo localmente', conversationId, scope, (db) => {
      const conversation = db.conversations?.find((c) => c.id === conversationId);
      if (!conversation) throw new Error('Conversa indisponível.');
      requireContext(db, scope, debtId, conversation);
      const value = chatTextSchema.parse(text);
      const now = new Date().toISOString();
      const existing = conversation.drafts.find((d) => d.id === draftId);
      if (draftId && !existing) throw new Error('Rascunho indisponível. Reabra a conversa.');
      if (existing && existing.debtId !== debtId)
        throw new Error('O contrato do rascunho não pode ser alterado.');
      if (existing)
        Object.assign(existing, { text: value, updatedAt: now, actor: db.settings.operatorName });
      else
        conversation.drafts.push({
          id: id('msg'),
          debtId,
          text: value,
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
};
