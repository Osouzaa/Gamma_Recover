import { z } from 'zod';
import { debtorContactsSchema } from './contactChannels';
import { requireDebt, requireRole, transact, type Scope } from './store';
export const DebtorContactService = {
  save(scope: Scope, debtId: string, values: z.infer<typeof debtorContactsSchema>) {
    return transact('Canais do contribuinte atualizados', debtId, scope, (db) => {
      requireRole(scope, ['Administrador', 'Operador'], db);
      const debt = requireDebt(db, scope, debtId);
      const debtor = db.debtors.find((d) => d.id === debt.debtorId)!;
      const v = debtorContactsSchema.parse(values);
      Object.assign(debtor, v, { preferredChannel: v.preferredChannel || undefined });
    });
  },
};
