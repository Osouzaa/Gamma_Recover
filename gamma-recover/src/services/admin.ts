import { z } from 'zod';
import { companyProfileSchema } from './companySchema';
import { id } from '../utils/format';
import { requireRole, transact, type Scope } from './store';
export const creditorSchema = z.object({
  name: z.string().trim().min(3).max(100),
  document: z.string().regex(/^DEMO-[A-Za-z0-9-]+$/, 'Use documento fictício DEMO-...'),
  profile: companyProfileSchema.optional(),
  policy: z.object({
    maxDiscount: z.number().min(0).max(80),
    approvalAbove: z.number().min(0).max(80).optional(),
    maxInstallments: z.number().int().min(1).max(36),
    minInstallment: z.number().int().min(100),
  }),
});
export const companySchema = creditorSchema
  .omit({ policy: true })
  .extend({ profile: companyProfileSchema });
type CreditorInput = z.infer<typeof creditorSchema>;
function saveCreditor(
  scope: Scope,
  values: Omit<CreditorInput, 'policy'> & { policy?: CreditorInput['policy'] },
  creditorId?: string,
) {
  const entityId = creditorId || id('cr');
  return transact(
    'Empresa e política salvas',
    entityId,
    { ...scope, creditorId: entityId },
    (db) => {
      requireRole(scope, ['Administrador'], db);
      if (scope.creditorId && scope.creditorId !== creditorId)
        throw new Error('Altere para todos os credores para cadastrar.');
      const existing = db.creditors.find((c) => c.id === creditorId);
      if (creditorId && !existing) throw new Error('Credor não encontrado.');
      const v = creditorSchema.parse({
        ...values,
        policy: values.policy ??
          existing?.policy ?? {
            maxDiscount: 0,
            approvalAbove: 0,
            maxInstallments: 1,
            minInstallment: 100,
          },
      });
      if ((v.policy.approvalAbove ?? v.policy.maxDiscount) > v.policy.maxDiscount)
        throw new Error('O limite de aprovação automática não pode ultrapassar o desconto máximo.');
      if (db.creditors.some((c) => c.document === v.document && c.id !== creditorId))
        throw new Error('Documento fictício já cadastrado.');
      if (existing) Object.assign(existing, v);
      else db.creditors.push({ ...v, id: entityId });
      return entityId;
    },
  );
}
export const CreditorService = {
  async save(scope: Scope, values: CreditorInput, creditorId?: string) {
    return saveCreditor(scope, creditorSchema.parse(values), creditorId);
  },
  async saveCompany(scope: Scope, values: z.infer<typeof companySchema>, creditorId?: string) {
    return saveCreditor(scope, companySchema.parse(values), creditorId);
  },
};
export const SettingsService = {
  save(scope: Scope, returnDays: number) {
    return transact('Parâmetros operacionais salvos', 'settings', scope, (db) => {
      requireRole(scope, ['Administrador'], db);
      if (!Number.isInteger(returnDays) || returnDays < 1 || returnDays > 30)
        throw new Error('Prazo de retorno deve ser de 1 a 30 dias.');
      db.settings.returnDays = returnDays;
    });
  },
  switchRole(scope: Scope, role: 'Administrador' | 'Operador' | 'Financeiro') {
    return transact('Perfil demonstrativo selecionado', 'settings', scope, (db) => {
      z.enum(['Administrador', 'Operador', 'Financeiro']).parse(role);
      db.settings.role = role;
      db.settings.operatorName =
        role === 'Administrador'
          ? 'Ana Administradora ? demo'
          : role === 'Operador'
            ? 'Rafael Operador ? demo'
            : 'Beatriz Financeiro ? demo';
    });
  },
};
