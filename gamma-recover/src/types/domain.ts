import type { Journey, JourneyRun } from '../services/journeySchema';
import type { Task } from '../services/taskSchema';
import type { Location } from '../services/location';
import type { Conversation } from './conversations';
import type { ContactChannel } from '../services/contactChannels';
import type { CompanyProfile } from '../services/companySchema';
export type Role = 'Administrador' | 'Operador' | 'Financeiro';
export interface Policy {
  maxDiscount: number;
  approvalAbove?: number;
  maxInstallments: number;
  minInstallment: number;
}
export interface Creditor {
  id: string;
  name: string;
  document: string;
  policy: Policy;
  profile?: CompanyProfile;
}
export interface Portfolio {
  id: string;
  creditorId: string;
  name: string;
  active: boolean;
  createdAt: string;
}
export interface Debtor {
  id: string;
  name: string;
  document: string;
  email: string;
  phone: string;
  whatsapp?: string;
  preferredChannel?: ContactChannel;
  blocked: boolean;
  location?: Location;
}
export interface Debt {
  id: string;
  portfolioId: string;
  debtorId: string;
  reference: string;
  amount: number;
  dueDate: string;
  disputed: boolean;
  suspensionHistory?: {
    suspended: boolean;
    reason: string;
    actor: string;
    date: string;
  }[];
}
export interface Contact {
  debtId?: string;
  actor?: string;
  id: string;
  debtorId: string;
  creditorId: string;
  channel?: ContactChannel | 'Registro interno';
  destination?: string;
  result: string;
  note: string;
  date: string;
  nextDate?: string;
  promiseAmount?: number;
  closed: boolean;
}
export interface Proposal {
  id: string;
  debtId: string;
  discount: number;
  entry: number;
  count: number;
  total: number;
  createdAt: string;
  status: 'Simulada' | 'Aceita' | 'Aguardando aprovação';
  approvedBy?: string;
}
export interface Agreement {
  id: string;
  debtId: string;
  proposalId: string;
  total: number;
  createdAt: string;
  cancelled: boolean;
  broken: boolean;
  acceptedBy: string;
}
export interface Installment {
  id: string;
  agreementId: string;
  number: number;
  amount: number;
  dueDate: string;
  paidAt?: string;
  paymentReference?: string;
  divergence?: string;
}
export interface Campaign {
  id: string;
  creditorId: string;
  name: string;
  minDays: number;
  status: 'Rascunho' | 'Simulada' | 'Encerrada';
  audience: string[];
  createdAt: string;
}
export interface Audit {
  id: string;
  date: string;
  actor: string;
  action: string;
  entityId: string;
  creditorId?: string;
}
export interface ImportRecord {
  id: string;
  portfolioId: string;
  date: string;
  count: number;
  filename: string;
  actor?: string;
}
export interface Dispute {
  id: string;
  debtId: string;
  reason: string;
  date: string;
}
export interface Database {
  version: 1;
  creditors: Creditor[];
  portfolios: Portfolio[];
  debtors: Debtor[];
  debts: Debt[];
  contacts: Contact[];
  proposals: Proposal[];
  agreements: Agreement[];
  installments: Installment[];
  campaigns: Campaign[];
  audit: Audit[];
  imports: ImportRecord[];
  disputes: Dispute[];
  conversations?: Conversation[];
  tasks?: Task[];
  journeys?: Journey[];
  journeyRuns?: JourneyRun[];
  settings: { operatorName: string; role: Role; returnDays: number };
}
