import { journeySchema, journeyRunSchema } from './journeySchema';
import { taskSchema } from './taskSchema';
import { locationSchema } from './location';
import { conversationSchema } from './conversationSchema';
import { z } from 'zod';
import { attendanceChannelSchema, contactChannels } from './contactChannels';
import { companyProfileSchema } from './companySchema';
const text = z.string().min(1);
const amount = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);
const date = z.iso.date();
const policy = z.object({
  maxDiscount: z.number().min(0).max(80),
  approvalAbove: z.number().min(0).max(80).optional(),
  maxInstallments: z.number().int().min(1).max(36),
  minInstallment: amount,
});
export const databaseSchema = z
  .object({
    version: z.literal(1),
    creditors: z.array(
      z.object({
        id: text,
        name: text,
        document: text,
        policy,
        profile: companyProfileSchema.optional(),
      }),
    ),
    portfolios: z.array(
      z.object({ id: text, creditorId: text, name: text, active: z.boolean(), createdAt: date }),
    ),
    debtors: z.array(
      z.object({
        id: text,
        name: text,
        document: text,
        email: z.string(),
        phone: z.string(),
        whatsapp: z.string().optional(),
        preferredChannel: z.enum(contactChannels).optional(),
        blocked: z.boolean(),
        location: locationSchema.optional(),
      }),
    ),
    debts: z.array(
      z.object({
        id: text,
        portfolioId: text,
        debtorId: text,
        reference: text,
        amount,
        dueDate: date,
        disputed: z.boolean(),
        suspensionHistory: z
          .array(
            z.object({
              suspended: z.boolean(),
              reason: z.string().trim().min(5).max(2000),
              actor: text,
              date: z.iso.datetime(),
            }),
          )
          .optional(),
      }),
    ),
    contacts: z.array(
      z.object({
        debtId: text.optional(),
        actor: text.optional(),
        id: text,
        debtorId: text,
        creditorId: text,
        channel: attendanceChannelSchema.optional(),
        destination: text.optional(),
        result: text,
        note: text,
        date: text,
        nextDate: date.optional(),
        promiseAmount: amount.optional(),
        closed: z.boolean(),
      }),
    ),
    proposals: z.array(
      z.object({
        id: text,
        debtId: text,
        discount: z.number().min(0).max(80),
        entry: z.number().int().nonnegative(),
        count: z.number().int().positive(),
        total: amount,
        createdAt: date,
        status: z.enum(['Simulada', 'Aceita', 'Aguardando aprovação']),
        approvedBy: text.optional(),
      }),
    ),
    agreements: z.array(
      z.object({
        id: text,
        debtId: text,
        proposalId: text,
        total: amount,
        createdAt: date,
        cancelled: z.boolean(),
        broken: z.boolean(),
        acceptedBy: text,
      }),
    ),
    installments: z.array(
      z.object({
        id: text,
        agreementId: text,
        number: z.number().int().nonnegative(),
        amount,
        dueDate: date,
        paidAt: date.optional(),
        paymentReference: text.optional(),
        divergence: text.optional(),
      }),
    ),
    campaigns: z.array(
      z.object({
        id: text,
        creditorId: text,
        name: text,
        minDays: z.number().int().nonnegative(),
        status: z.enum(['Rascunho', 'Simulada', 'Encerrada']),
        audience: z.array(text),
        createdAt: date,
      }),
    ),
    audit: z.array(
      z.object({
        id: text,
        date: text,
        actor: text,
        action: text,
        entityId: text,
        creditorId: text.optional(),
      }),
    ),
    imports: z.array(
      z.object({
        id: text,
        portfolioId: text,
        date,
        count: z.number().int().positive(),
        filename: text,
        actor: text.optional(),
      }),
    ),
    disputes: z.array(z.object({ id: text, debtId: text, reason: text, date: text })),
    conversations: z.array(conversationSchema).optional(),
    tasks: z.array(taskSchema).optional(),
    journeys: z.array(journeySchema).optional(),
    journeyRuns: z.array(journeyRunSchema).optional(),
    settings: z.object({
      operatorName: text,
      role: z.enum(['Administrador', 'Operador', 'Financeiro']),
      returnDays: z.number().int().min(1).max(30),
    }),
  })
  .superRefine((db, ctx) => {
    const issue = (message: string) => ctx.addIssue({ code: 'custom', message });
    for (const [key, value] of Object.entries(db)) {
      if (Array.isArray(value) && new Set(value.map((v) => v.id)).size !== value.length)
        issue(`IDs duplicados: ${key}`);
    }
    for (const contact of db.contacts) {
      if (!contact.debtId) continue;
      const debt = db.debts.find((d) => d.id === contact.debtId);
      if (
        !debt ||
        debt.debtorId !== contact.debtorId ||
        !db.portfolios.some((p) => p.id === debt.portfolioId && p.creditorId === contact.creditorId)
      )
        issue('Atendimento fora do contrato/credor.');
    }
    for (const task of db.tasks || []) {
      if (!db.debts.some((d) => d.id === task.debtId)) issue('Tarefa sem contrato.');
      if (
        task.sourceContactId &&
        !db.contacts.some((c) => c.id === task.sourceContactId && c.debtId === task.debtId)
      )
        issue('Tarefa sem atendimento de origem válido.');
    }
    for (const journey of db.journeys || []) {
      if (!db.creditors.some((c) => c.id === journey.creditorId)) issue('Régua sem empresa.');
    }
    for (const run of db.journeyRuns || []) {
      const journey = db.journeys?.find((j) => j.id === run.journeyId);
      if (!journey || run.revision > journey.revision) issue('Simulação sem régua/revisão válida.');
      for (const result of run.results) {
        const debt = db.debts.find((d) => d.id === result.debtId);
        if (
          !debt ||
          !db.portfolios.some(
            (p) => p.id === debt.portfolioId && p.creditorId === journey?.creditorId,
          )
        )
          issue('Simulação fora da empresa.');
      }
    }
    const conversationKeys = new Set<string>();
    for (const c of db.conversations || []) {
      const key = `${c.creditorId}:${c.debtorId}:${c.channel ?? 'WhatsApp'}:${c.destination}`;
      if (conversationKeys.has(key)) issue('Conversa duplicada para empresa, pessoa e número.');
      conversationKeys.add(key);
      if (
        !db.creditors.some((v) => v.id === c.creditorId) ||
        !db.debtors.some((v) => v.id === c.debtorId)
      )
        issue('Conversa com vínculo inválido.');
      if (
        !db.debts.some(
          (d) =>
            d.debtorId === c.debtorId &&
            db.portfolios.some((p) => p.id === d.portfolioId && p.creditorId === c.creditorId),
        )
      )
        issue('Conversa sem contrato na empresa.');
      if (new Set(c.drafts.map((d) => d.id)).size !== c.drafts.length) issue('Rascunho duplicado.');
      const messages = [...c.drafts, ...(c.simulations || [])];
      if (new Set(messages.map((message) => message.id)).size !== messages.length)
        issue('Mensagem duplicada na conversa.');
      for (const draft of messages) {
        const debt = db.debts.find((d) => d.id === draft.debtId);
        if (
          !debt ||
          debt.debtorId !== c.debtorId ||
          !db.portfolios.some((p) => p.id === debt.portfolioId && p.creditorId === c.creditorId)
        )
          issue('Rascunho fora da empresa ou pessoa da conversa.');
      }
    }
    for (const p of db.portfolios)
      if (!db.creditors.some((c) => c.id === p.creditorId)) issue('Carteira sem credor.');
    for (const i of db.imports)
      if (!db.portfolios.some((p) => p.id === i.portfolioId)) issue('Importação sem carteira.');
    for (const d of db.debts)
      if (
        !db.portfolios.some((p) => p.id === d.portfolioId) ||
        !db.debtors.some((v) => v.id === d.debtorId)
      )
        issue('Dívida com vínculo inválido.');
    for (const p of db.proposals)
      if (!db.debts.some((d) => d.id === p.debtId)) issue('Proposta sem dívida.');
    for (const a of db.agreements) {
      const p = db.proposals.find((p) => p.id === a.proposalId);
      if (!p || p.debtId !== a.debtId || p.total !== a.total)
        issue('Acordo incompatível com proposta.');
      if (
        db.installments.filter((i) => i.agreementId === a.id).reduce((s, i) => s + i.amount, 0) !==
        a.total
      )
        issue('Soma das parcelas diverge do acordo.');
    }
    for (const i of db.installments)
      if (!db.agreements.some((a) => a.id === i.agreementId)) issue('Parcela sem acordo.');
    const active = db.agreements.filter((a) => !a.cancelled);
    if (new Set(active.map((a) => a.debtId)).size !== active.length)
      issue('Mais de um acordo vigente para a mesma dívida.');
  });
