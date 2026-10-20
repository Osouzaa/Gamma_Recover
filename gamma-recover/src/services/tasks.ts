import type { z } from 'zod';
import type { Database } from '../types/domain';
import { creditorOf } from './domain';
import { taskInputSchema, type Task } from './taskSchema';
import { requireDebt, requireRole, transact, type Scope } from './store';
import { id, today } from '../utils/format';
export function appendTask(
  db: Database,
  values: z.infer<typeof taskInputSchema>,
  sourceContactId?: string,
) {
  const value = taskInputSchema.parse(values);
  const task: Task = {
    ...value,
    id: id('tk'),
    responsible: db.settings.operatorName,
    createdAt: new Date().toISOString(),
    sourceContactId,
  };
  (db.tasks ??= []).push(task);
  return task;
}
export function taskRows(db: Database, creditorId: string) {
  return (db.tasks || [])
    .filter((task) => {
      const debt = db.debts.find((d) => d.id === task.debtId);
      return debt && (!creditorId || creditorOf(db, debt) === creditorId);
    })
    .map((task) => {
      const debt = db.debts.find((d) => d.id === task.debtId)!;
      return {
        ...task,
        debt,
        debtor: db.debtors.find((d) => d.id === debt.debtorId)!,
        status: task.completedAt
          ? 'Concluída'
          : task.dueDate < today()
            ? 'Atrasada'
            : task.dueDate === today()
              ? 'Hoje'
              : 'Futura',
      };
    })
    .sort(
      (a, b) =>
        Number(!!a.completedAt) - Number(!!b.completedAt) || a.dueDate.localeCompare(b.dueDate),
    );
}
export const TaskService = {
  create(scope: Scope, values: z.infer<typeof taskInputSchema>) {
    return transact('Tarefa criada', values.debtId, scope, (db) => {
      requireRole(scope, ['Administrador', 'Operador'], db);
      const value = taskInputSchema.parse(values);
      requireDebt(db, scope, value.debtId);
      if (value.dueDate < today()) throw new Error('A tarefa deve vencer hoje ou em data futura.');
      return appendTask(db, value);
    });
  },
  complete(scope: Scope, taskId: string) {
    return transact('Tarefa concluída', taskId, scope, (db) => {
      requireRole(scope, ['Administrador', 'Operador'], db);
      const task = db.tasks?.find((t) => t.id === taskId);
      if (!task) throw new Error('Tarefa indisponível.');
      requireDebt(db, scope, task.debtId);
      if (task.completedAt) throw new Error('Esta tarefa já foi concluída.');
      task.completedAt = new Date().toISOString();
      task.completedBy = db.settings.operatorName;
    });
  },
};
