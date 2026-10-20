import { adminReturnPath } from '../services/adminSession';
import { collectionQueue } from '../services/collectionQueue';
import { beforeEach, expect, it } from 'vitest';
import { demoAdapter, withDatabase } from '../services/persistence';
import { CollectionService } from '../services/operations';
import { TaskService, taskRows } from '../services/tasks';
import { JourneyService } from '../services/journeys';
import { DebtSuspensionService } from '../services/debtSuspension';
import { databaseSchema } from '../services/schema';
import { today } from '../utils/format';
const scope = { creditorId: 'cr-1', role: 'Administrador' as const };
const definition = {
  creditorId: 'cr-1',
  name: 'Régua demonstrativa',
  active: true,
  steps: [
    { offset: 0, channel: 'Tarefa interna' as const, note: 'Revisar contrato demonstrativo.' },
  ],
};
beforeEach(async () => {
  localStorage.clear();
  await demoAdapter.reset();
});
it('preserva legado e gera tarefa auditada somente para um retorno novo vinculado ao contrato', async () => {
  const before = await demoAdapter.read();
  expect(before.tasks).toBeUndefined();
  expect(before.contacts[0].debtId).toBeUndefined();
  await CollectionService.record(scope, {
    debtorId: 'dv-10',
    debtId: 'dt-10',
    result: 'Retorno agendado',
    note: 'Revisar contrato com o cliente.',
    nextDate: today(),
    promiseAmount: 0,
  });
  const db = await demoAdapter.read();
  expect(db.contacts[0]).toMatchObject({ debtId: 'dt-10', actor: db.settings.operatorName });
  expect(db.tasks).toHaveLength(1);
  expect(db.tasks![0]).toMatchObject({
    debtId: 'dt-10',
    sourceContactId: db.contacts[0].id,
    responsible: db.settings.operatorName,
  });
  expect(db.contacts.at(-1)).toEqual(before.contacts[0]);
  expect(db.agreements).toEqual(before.agreements);
  expect(db.installments).toEqual(before.installments);
  expect(taskRows(db, 'cr-2')).toEqual([]);
  expect(taskRows(db, 'cr-1')[0].status).toBe('Hoje');
});
it('conclui tarefa uma única vez, sem encerrar cobrança ou confirmar recebimento', async () => {
  const task = await TaskService.create(scope, {
    debtId: 'dt-10',
    title: 'Revisar documentação',
    dueDate: today(),
  });
  const before = await demoAdapter.read();
  const result = await Promise.allSettled([
    TaskService.complete(scope, task.id),
    TaskService.complete(scope, task.id),
  ]);
  expect(result.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
  const db = await demoAdapter.read();
  expect(taskRows(db, 'cr-1')[0].status).toBe('Concluída');
  expect(db.contacts).toEqual(before.contacts);
  expect(db.installments).toEqual(before.installments);
  await expect(
    TaskService.create(
      { ...scope, creditorId: 'cr-2' },
      { debtId: 'dt-10', title: 'Outra tarefa', dueDate: today() },
    ),
  ).rejects.toThrow('contexto');
  await expect(TaskService.complete({ ...scope, role: 'Financeiro' }, task.id)).rejects.toThrow(
    'perfil',
  );
  expect(await demoAdapter.read()).toEqual(db);
});
it('valida vínculos novos sem atribuir um contrato artificial aos contatos antigos', async () => {
  const db = await demoAdapter.read();
  expect(databaseSchema.safeParse(db).success).toBe(true);
  db.contacts[0].debtId = 'dt-11';
  expect(databaseSchema.safeParse(db).success).toBe(false);
});
it('simula com idempotência, pausa por restrições e preserva as obrigações e o histórico', async () => {
  await withDatabase('readwrite', (db) => {
    db.debts[9].dueDate = today();
  });
  const journeyId = await JourneyService.save(scope, definition);
  const before = await demoAdapter.read();
  const first = await JourneyService.simulate(scope, journeyId);
  expect(first.results.find((r) => r.debtId === 'dt-10')?.eligible).toBe(true);
  expect(first.results.some((r) => r.reason.includes('acordo'))).toBe(true);
  expect((await JourneyService.simulate(scope, journeyId)).id).toBe(first.id);
  expect((await demoAdapter.read()).journeyRuns).toHaveLength(1);
  await DebtSuspensionService.set(scope, 'dt-10', true, 'Revisão documental solicitada.');
  const second = await JourneyService.simulate(scope, journeyId);
  expect(second.id).not.toBe(first.id);
  expect(second.results.find((r) => r.debtId === 'dt-10')).toMatchObject({
    eligible: false,
    reason: 'Contrato bloqueado, suspenso ou contestado',
  });
  const db = await demoAdapter.read();
  expect(db.journeyRuns![0]).toEqual(first);
  expect(db.installments).toEqual(before.installments);
  expect(db.contacts).toEqual(before.contacts);
  expect(db.tasks).toBeUndefined();
});
it('recusa canal indisponível, etapas passadas, empresa errada e gravação concorrente da revisão', async () => {
  const journeyId = await JourneyService.save(scope, {
    ...definition,
    steps: [{ offset: 365, channel: 'WhatsApp', note: 'Canal ainda não cadastrado.' }],
  });
  const run = await JourneyService.simulate(scope, journeyId);
  expect(run.results.some((r) => r.reason === 'Canal sem destino utilizável')).toBe(true);
  await expect(JourneyService.save(scope, definition, journeyId, 99)).rejects.toThrow('alterada');
  await expect(
    JourneyService.simulate({ ...scope, creditorId: 'cr-2' }, journeyId),
  ).rejects.toThrow('contexto');
  await expect(JourneyService.save({ ...scope, role: 'Operador' }, definition)).rejects.toThrow(
    'perfil',
  );
  await JourneyService.save(scope, { ...definition, active: false }, journeyId, 1);
  await expect(JourneyService.simulate(scope, journeyId)).rejects.toThrow('Retome');
  expect((await demoAdapter.read()).journeyRuns![0]).toEqual(run);
  expect(run.results[0].note).toBe('Canal ainda não cadastrado.');
});

it('encerra somente o contrato novo e conserva a abrangência dos encerramentos legados', async () => {
  await withDatabase('readwrite', (db) => {
    db.debts.push({ ...db.debts[9], id: 'dt-second', reference: 'DEMO-SECOND' });
  });
  await CollectionService.record(scope, {
    debtId: 'dt-10',
    debtorId: 'dv-10',
    result: 'Encerrado',
    note: 'Contrato encerrado pelo operador.',
    nextDate: '',
    promiseAmount: 0,
  });
  const db = await demoAdapter.read();
  expect(collectionQueue(db, scope).some((d) => d.id === 'dt-10')).toBe(false);
  expect(collectionQueue(db, scope).some((d) => d.id === 'dt-second')).toBe(true);
  delete db.contacts[0].debtId;
  expect(collectionQueue(db, scope).some((d) => d.id === 'dt-second')).toBe(false);
});

it('preserva destinos internos de tarefas e réguas após login sem permitir redirecionamento externo', () => {
  expect(adminReturnPath('/tarefas?estado=hoje')).toBe('/tarefas?estado=hoje');
  expect(adminReturnPath('/reguas')).toBe('/reguas');
  expect(adminReturnPath('//externo.example/reguas')).toBe('/');
});
