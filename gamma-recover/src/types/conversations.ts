export interface ChatDraft {
  id: string;
  debtId: string;
  text: string;
  actor: string;
  createdAt: string;
  updatedAt: string;
}
export interface Conversation {
  id: string;
  creditorId: string;
  debtorId: string;
  destination: string;
  createdAt: string;
  updatedAt: string;
  drafts: ChatDraft[];
}
