import type { Database } from '../types/domain';
import { activeAgreement, contactBlocked, creditorOf } from './domain';
import { contactDestination } from './contactChannels';
import {
  journeyInputSchema,
  journeyRunSchema,
  type Journey,
  type JourneyInput,
  type JourneyRun,
} from './journeySchema';
import { requireRole, transact, type Scope } from './store';
import { addDays, id, today } from '../utils/format';
export function previewJourney(
  db: Database,
  journey: Journey,
  asOf = today(),
): JourneyRun['results'] {
  return db.debts
    .filter((d) => creditorOf(db, d) === journey.creditorId)
    .flatMap((debt) => {
      const person = db.debtors.find((d) => d.id === debt.debtorId)!;
      const portfolio = db.portfolios.find((p) => p.id === debt.portfolioId)!;
      return journey.steps.map((step, index) => {
        const scheduledDate = addDays(debt.dueDate, step.offset);
        const reason = !journey.active
          ? 'Régua pausada'
          : !portfolio.active
            ? 'Carteira inativa'
            : contactBlocked(db, debt)
              ? 'Contrato bloqueado, suspenso ou contestado'
              : activeAgreement(db, debt.id)
                ? 'Contrato com acordo não cancelado'
                : scheduledDate < asOf
                  ? 'Etapa anterior à data da simulação'
                  : step.channel !== 'Tarefa interna' && !contactDestination(person, step.channel)
                    ? 'Canal sem destino utilizável'
                    : '';
        return {
          debtId: debt.id,
          step: index,
          channel: step.channel,
          note: step.note,
          scheduledDate,
          reason,
          eligible: !reason,
        };
      });
    });
}
export const JourneyService = {
  save(scope: Scope, input: JourneyInput, journeyId?: string, expectedRevision?: number) {
    return transact('Régua salva', journeyId || 'nova', scope, (db) => {
      requireRole(scope, ['Administrador'], db);
      const value = journeyInputSchema.parse(input);
      value.steps.sort((a, b) => a.offset - b.offset || a.channel.localeCompare(b.channel));
      if (
        !db.creditors.some((c) => c.id === value.creditorId) ||
        (scope.creditorId && scope.creditorId !== value.creditorId)
      )
        throw new Error('Empresa fora do contexto.');
      const existing = db.journeys?.find((j) => j.id === journeyId);
      if (journeyId && !existing) throw new Error('Régua indisponível.');
      if (
        existing &&
        (existing.creditorId !== value.creditorId || existing.revision !== expectedRevision)
      )
        throw new Error(
          'A régua foi alterada ou pertence a outra empresa. Reabra antes de salvar.',
        );
      const updatedAt = new Date().toISOString();
      if (existing) {
        Object.assign(existing, value, { revision: existing.revision + 1, updatedAt });
        return existing.id;
      }
      const journey: Journey = { ...value, id: id('jr'), revision: 1, updatedAt };
      (db.journeys ??= []).push(journey);
      return journey.id;
    });
  },
  simulate(scope: Scope, journeyId: string) {
    return transact('Régua simulada sem envios', journeyId, scope, (db) => {
      requireRole(scope, ['Administrador'], db);
      const journey = db.journeys?.find((j) => j.id === journeyId);
      if (!journey || (scope.creditorId && journey.creditorId !== scope.creditorId))
        throw new Error('Régua indisponível neste contexto.');
      if (!journey.active) throw new Error('Retome a régua antes de simular.');
      const date = today();
      const results = journeyRunSchema.shape.results.parse(previewJourney(db, journey, date));
      const runs = (db.journeyRuns ??= []);
      const same = runs.find(
        (r) =>
          r.journeyId === journey.id &&
          r.revision === journey.revision &&
          r.date === date &&
          JSON.stringify(r.results) === JSON.stringify(results),
      );
      if (same) return same;
      const run: JourneyRun = {
        id: id('js'),
        journeyId,
        revision: journey.revision,
        date,
        actor: db.settings.operatorName,
        results,
      };
      runs.push(run);
      return run;
    });
  },
};
