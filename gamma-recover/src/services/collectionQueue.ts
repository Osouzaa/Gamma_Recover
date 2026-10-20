import type { Database } from '../types/domain';
import { activeAgreement, creditorOf, isSuspended } from './domain';
import { scopedDebts } from './operations';
import type { Scope } from './store';
export function collectionQueue(db: Database, scope: Scope) {
  return scopedDebts(db, scope).filter(
    (debt) =>
      !activeAgreement(db, debt.id) &&
      !isSuspended(debt) &&
      !db.contacts.some(
        (contact) =>
          contact.closed &&
          (contact.debtId
            ? contact.debtId === debt.id
            : contact.debtorId === debt.debtorId && contact.creditorId === creditorOf(db, debt)),
      ),
  );
}
