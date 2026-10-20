import { z } from 'zod';
import { isSuspended } from './domain';
import { requireDebt, requireRole, transact, type Scope } from './store';
const reasonSchema = z
  .string()
  .trim()
  .min(5, 'Informe um motivo com pelo menos 5 caracteres.')
  .max(2000);
export const DebtSuspensionService = {
  set(scope: Scope, debtId: string, suspended: boolean, reason: string) {
    return transact(
      suspended ? 'Cobrança do contrato suspensa' : 'Cobrança do contrato retomada',
      debtId,
      scope,
      (db) => {
        requireRole(scope, ['Administrador', 'Operador'], db);
        if (scope.debtorId) throw new Error('Ação restrita à operação interna.');
        const debt = requireDebt(db, scope, debtId);
        const value = reasonSchema.parse(reason);
        if (isSuspended(debt) === suspended)
          throw new Error('Situação já alterada. Atualize o cadastro antes de continuar.');
        (debt.suspensionHistory ??= []).push({
          suspended,
          reason: value,
          actor: db.settings.operatorName,
          date: new Date().toISOString(),
        });
      },
    );
  },
};
