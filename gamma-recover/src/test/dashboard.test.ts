import { describe, expect, it } from 'vitest';
import { seed } from '../mocks/seed';
import { DashboardService } from '../services/dashboard';
import { dashboardWindow, dayDistance } from '../services/dashboardPeriods';
import { metrics } from '../services/domain';
import { addDays, today } from '../utils/format';
describe('dashboard financeiro de leitura', () => {
  it('preserva a base e os totais das regras existentes', () => {
    const db = seed();
    const before = structuredClone(db);
    for (const creditorId of ['', 'cr-1', 'cr-2'])
      for (const period of ['1', '3', '6', 'all'] as const) {
        const overview = DashboardService.overview(db, creditorId, period);
        expect(overview.current).toEqual(
          metrics(db, creditorId, overview.window.start, overview.window.end),
        );
        expect(overview.series.reduce((s, p) => s + p.received, 0)).toBe(overview.current.received);
        expect(overview.creditors.reduce((s, c) => s + c.amount, 0)).toBe(overview.current.managed);
        expect(overview.states.reduce((s, c) => s + c.count, 0)).toBe(
          db.agreements.filter((a) => overview.current.debts.some((d) => d.id === a.debtId)).length,
        );
      }
    expect(db).toEqual(before);
  });
  it.each(['1', '3', '6'] as const)(
    'compara janelas consecutivas com igual duração: %s',
    (period) => {
      const window = dashboardWindow(seed(), period, '2024-03-31');
      expect(dayDistance(window.previousStart!, window.previousEnd!) + 1).toBe(window.days);
      expect(addDays(window.previousEnd!, 1)).toBe(window.start);
    },
  );
  it('omite comparações quando não existe base anterior', () => {
    const db = seed();
    for (const i of db.installments) {
      delete i.paidAt;
      delete i.paymentReference;
    }
    const overview = DashboardService.overview(db, '', '1');
    expect(overview.receivedVariation).toBeUndefined();
    expect(overview.series.every((p) => p.previous === undefined)).toBe(true);
    expect(DashboardService.overview(db, '', 'all').receivedVariation).toBeUndefined();
  });
  it('compara recebimentos por data e exclui datas futuras', () => {
    const db = seed();
    db.installments.forEach((i) => {
      delete i.paidAt;
      delete i.paymentReference;
    });
    const window = dashboardWindow(db, '1');
    db.installments[0].paidAt = window.previousStart;
    db.installments[1].paidAt = today();
    db.installments[2].paidAt = addDays(today(), 1);
    const overview = DashboardService.overview(db, 'cr-1', '1');
    expect(overview.current.received).toBe(db.installments[1].amount);
    expect(overview.receivedVariation).toBe(
      ((db.installments[1].amount - db.installments[0].amount) / db.installments[0].amount) * 100,
    );
    expect(overview.series.reduce((s, p) => s + (p.previous || 0), 0)).toBe(
      db.installments[0].amount,
    );
  });
  it('conta tentativas na eficiência e pessoas únicas no funil', () => {
    const db = seed();
    const base = {
      debtorId: 'dv-10',
      creditorId: 'cr-1',
      note: 'Registro fictício',
      date: new Date().toISOString(),
      closed: false,
    };
    db.contacts = [
      { ...base, id: 'x-1', result: 'Sem contato' },
      { ...base, id: 'x-2', result: 'Promessa de pagamento' },
    ];
    const o = DashboardService.overview(db, 'cr-1', '1');
    expect(o.efficiency).toBe(50);
    expect(o.funnel.map((s) => s.count).slice(1)).toEqual([1, 1, 0]);
    expect(DashboardService.overview(db, 'cr-2', '1').contacts).toHaveLength(0);
  });
  it('vencimentos e divergências consideram apenas parcelas abertas em acompanhamento', () => {
    const db = seed();
    const o = DashboardService.overview(db, 'cr-1', '6');
    for (const i of o.nextDue) {
      expect(i.paidAt).toBeUndefined();
      expect(i.dueDate >= today() && i.dueDate <= addDays(today(), 7)).toBe(true);
      const a = db.agreements.find((a) => a.id === i.agreementId)!;
      expect(a.cancelled || a.broken).toBe(false);
    }
  });
});
