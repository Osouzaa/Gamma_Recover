export type MessageChannel = 'WhatsApp' | 'E-mail' | 'SMS';
export interface ChatDraft {
  id: string;
  debtId: string;
  text: string;
  actor: string;
  createdAt: string;
  updatedAt: string;
  subject?: string;
}
export interface ChatSimulation extends ChatDraft {
  outcome: 'Envio simulado' | 'Falha simulada';
}
export interface Conversation {
  id: string;
  creditorId: string;
  debtorId: string;
  destination: string;
  createdAt: string;
  updatedAt: string;
  drafts: ChatDraft[];
  channel?: MessageChannel;
  simulations?: ChatSimulation[];
}
