import { locationSchema, type Location } from './location';
import { requireDebt, requireRole, transact, type Scope } from './store';
export const DebtorLocationService = {
  save(scope: Scope, debtId: string, location?: Location) {
    return transact('Localização do devedor atualizada', debtId, scope, (db) => {
      requireRole(scope, ['Administrador', 'Operador'], db);
      const debt = requireDebt(db, scope, debtId);
      const debtor = db.debtors.find((d) => d.id === debt.debtorId)!;
      if (location) debtor.location = locationSchema.parse(location);
      else delete debtor.location;
    });
  },
};
