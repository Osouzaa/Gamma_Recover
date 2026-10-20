import type { Database, Role } from '../types/domain';
import { creditorOf } from './domain';
import { id } from '../utils/format';
import { portalSession } from './portalSession';
import { withDatabase } from './persistence';
export { demoAdapter, storageKey } from './persistence';
export type Scope = { creditorId: string; role: Role; debtorId?: string };
export function requireRole(scope: Scope, allowed: Role[], db?: Database) {
  if (!allowed.includes(scope.role) || (db && scope.role !== db.settings.role))
    throw new Error('Seu perfil demonstrativo não permite esta ação.');
}
export function requireDebt(db: Database, scope: Scope, debtId: string) {
  const debt = db.debts.find((d) => d.id === debtId);
  if (
    !debt ||
    (scope.creditorId && creditorOf(db, debt) !== scope.creditorId) ||
    (scope.debtorId && debt.debtorId !== scope.debtorId)
  )
    throw new Error('Dívida indisponível neste contexto.');
  if (scope.debtorId && portalSession() !== scope.debtorId)
    throw new Error('Sessão demonstrativa expirada. Acesse novamente.');
  return debt;
}
export function transact<T>(
  action: string,
  entityId: string,
  scope: Scope,
  fn: (db: Database) => T,
): Promise<T> {
  return withDatabase('readwrite', (db) => {
    const actor = scope.debtorId ? 'Portal demonstrativo' : db.settings.operatorName;
    const result = fn(db);
    db.audit.unshift({
      id: id('au'),
      date: new Date().toISOString(),
      actor,
      action,
      entityId,
      creditorId: scope.creditorId || undefined,
    });
    return result;
  });
}
