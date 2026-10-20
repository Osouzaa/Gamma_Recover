import { withDatabase } from '../services/persistence';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { seed } from '../mocks/seed';
import {
  activeAgreement,
  agreementStatus,
  createAgreement,
  metrics,
  simulate,
} from '../services/domain';
import {
  AgreementService,
  CollectionService,
  DebtorService,
  NegotiationService,
  PaymentService,
  PortfolioService,
} from '../services/operations';
import { demoAdapter, type Scope } from '../services/store';
import { ImportService, parseCSV } from '../services/import';
import { addMonths, csvCell, today } from '../utils/format';
const scope: Scope = { creditorId: 'cr-1', role: 'Administrador' };
beforeEach(async () => {
  localStorage.clear();
  await demoAdapter.reset();
});
describe('motor financeiro', () => {
  it('preserva centavos, entrada e vencimentos de fim de mês', async () => {
    const db = seed();
    const a = createAgreement(db, 'dt-10', 13.7, 10001, 7, 'teste');
    const items = db.installments.filter((i) => i.agreementId === a.id);
    expect(items.reduce((s, i) => s + i.amount, 0)).toBe(a.total);
    expect(items.every((i) => Number.isInteger(i.amount) && i.amount > 0 && !i.paidAt)).toBe(true);
    expect(items[0].amount).toBe(10001);
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28');
    expect(addMonths('2024-01-31', 1)).toBe('2024-02-29');
    expect(addMonths('2026-12-31', 2)).toBe('2027-02-28');
  });
  it.each([
    [31, 0, 2],
    [10, 0, 13],
    [-1, 0, 2],
    [10, 9999999, 2],
    [10, -1, 2],
    [10, 0, 1.5],
    [NaN, 0, 2],
    [0, 0, 0],
  ])('rejeita condições inválidas %s / %s / %s', (discount, entry, count) => {
    expect(() =>
      simulate(125000, discount, entry, count, {
        maxDiscount: 30,
        maxInstallments: 12,
        minInstallment: 5000,
      }),
    ).toThrow();
  });
  it('rejeita parcela abaixo do mínimo', async () =>
    expect(() =>
      simulate(5000, 0, 0, 2, { maxDiscount: 30, maxInstallments: 12, minInstallment: 5000 }),
    ).toThrow('mínimo'));
  it('impede duplicidade, bloqueios e contestação', async () => {
    const db = seed();
    createAgreement(db, 'dt-10', 10, 0, 2, 'teste');
    expect(() => createAgreement(db, 'dt-10', 10, 0, 2, 'teste')).toThrow('já possui');
    db.debtors[10].blocked = true;
    expect(() => createAgreement(db, 'dt-11', 10, 0, 2, 'teste')).toThrow('bloqueada');
    db.debts[11].disputed = true;
    expect(() => createAgreement(db, 'dt-12', 10, 0, 2, 'teste')).toThrow('bloqueada');
  });
  it('deriva indicadores e status dos registros relacionados', async () => {
    const db = seed();
    const m = metrics(db, 'cr-1');
    expect(m.managed).toBe(m.debts.reduce((s, d) => s + d.amount, 0));
    expect(m.received).toBe(
      m.installments.filter((i) => i.paidAt).reduce((s, i) => s + i.amount, 0),
    );
    const a = createAgreement(db, 'dt-10', 10, 0, 2, 'teste');
    expect(agreementStatus(db, a)).toBe('Ativo');
    db.installments.filter((i) => i.agreementId === a.id).forEach((i) => (i.paidAt = today()));
    expect(agreementStatus(db, a)).toBe('Cumprido');
  });
});
describe('operações integradas e persistência', () => {
  it('reflete acordo e conciliação no dashboard sem quitação automática', async () => {
    const before = metrics(await demoAdapter.read(), 'cr-1');
    const a = await NegotiationService.confirm(scope, 'dt-10', 10, 0, 2);
    let db = await demoAdapter.read();
    const installment = db.installments.find((i) => i.agreementId === a.id)!;
    expect(metrics(db, 'cr-1').negotiated).toBe(before.negotiated + a.total);
    expect(metrics(db, 'cr-1').received).toBe(before.received);
    await PaymentService.reconcile(
      scope,
      installment.id,
      installment.amount - 1,
      'DEMO-DIVERGENCIA',
    );
    expect(
      (await demoAdapter.read()).installments.find((i) => i.id === installment.id)?.paidAt,
    ).toBeUndefined();
    await PaymentService.reconcile(scope, installment.id, installment.amount, 'DEMO-OK');
    db = await demoAdapter.read();
    expect(metrics(db, 'cr-1').received).toBe(before.received + installment.amount);
    expect(db.audit.length).toBe(3);
    await expect(
      PaymentService.reconcile(scope, installment.id, installment.amount, 'DEMO-OK-2'),
    ).rejects.toThrow();
    await expect(AgreementService.cancel(scope, a.id)).rejects.toThrow('sem recebimentos');
  });
  it('permite cancelamento sem recebimentos e libera nova negociação', async () => {
    const a = await NegotiationService.confirm(scope, 'dt-10', 10, 0, 2);
    await AgreementService.cancel(scope, a.id);
    expect(activeAgreement(await demoAdapter.read(), 'dt-10')).toBeUndefined();
    await expect(NegotiationService.confirm(scope, 'dt-10', 10, 0, 2)).resolves.toHaveProperty(
      'id',
    );
  });
  it('não aceita dívida de outro credor ou outro devedor no portal', async () => {
    await expect(
      NegotiationService.confirm({ ...scope, creditorId: 'cr-2' }, 'dt-10', 10, 0, 2),
    ).rejects.toThrow('contexto');
    await expect(
      NegotiationService.confirm({ ...scope, debtorId: 'dv-11' }, 'dt-10', 10, 0, 2),
    ).rejects.toThrow('contexto');
    await expect(
      NegotiationService.confirm({ ...scope, role: 'Financeiro' }, 'dt-10', 10, 0, 2),
    ).rejects.toThrow('perfil');
    await expect(
      PortfolioService.save(
        { ...scope, role: 'Operador' },
        { name: 'Teste', creditorId: 'cr-1', active: true },
      ),
    ).rejects.toThrow('perfil');
  });
  it('bloqueio interrompe atendimento e criação de acordo', async () => {
    await DebtorService.block(scope, 'dt-10');
    await expect(
      CollectionService.record(scope, {
        debtId: 'dt-10',
        debtorId: 'dv-10',
        result: 'Contato realizado',
        note: 'Tentativa demonstrativa',
        nextDate: '',
        promiseAmount: 0,
      }),
    ).rejects.toThrow('bloqueado');
    await expect(NegotiationService.confirm(scope, 'dt-10', 10, 0, 2)).rejects.toThrow('bloqueada');
  });
  it('não confirma alterações quando armazenamento falha', async () => {
    const before = await demoAdapter.read();
    const write = vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(() => {
      throw new Error('Quota excedida');
    });
    try {
      await expect(NegotiationService.confirm(scope, 'dt-10', 10, 0, 2)).rejects.toThrow('Quota');
    } finally {
      write.mockRestore();
    }
    expect((await demoAdapter.read()).agreements).toEqual(before.agreements);
  });
  it('serializa duas tentativas concorrentes para o mesmo contrato', async () => {
    const results = await Promise.allSettled([
      NegotiationService.confirm(scope, 'dt-10', 10, 0, 2),
      NegotiationService.confirm(scope, 'dt-10', 10, 0, 2),
    ]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect((await demoAdapter.read()).agreements.filter((a) => a.debtId === 'dt-10')).toHaveLength(
      1,
    );
  });
  it('rejeita sessão de portal expirada mesmo com dívida correta', async () => {
    await expect(
      NegotiationService.confirm({ ...scope, debtorId: 'dv-10' }, 'dt-10', 10, 0, 2),
    ).rejects.toThrow('expirada');
  });
});
describe('importação transacional', () => {
  const csv =
    'documento;nome;contrato;valor;vencimento\nDEMO-999;Pessoa Fictícia;NOVO-999;1000,99;2026-09-10';
  it('valida datas, dados fictícios e duplicidade', async () => {
    expect(parseCSV(csv).rows[0].amount).toBe(100099);
    expect(parseCSV(csv.replace('2026-09-10', '2026-02-31')).errors.length).toBeGreaterThan(0);
    expect(parseCSV(csv.replace('DEMO-999', '12345678900')).errors.length).toBeGreaterThan(0);
    expect(
      parseCSV(csv + '\nDEMO-998;Outra Pessoa;NOVO-999;100;2026-09-10').errors.length,
    ).toBeGreaterThan(0);
  });
  it('interpreta aspas, delimitador e quebras de linha', async () => {
    const result = parseCSV(
      'documento;nome;contrato;valor;vencimento\r\nDEMO-X;"Pessoa; Fictícia";TEST-X;12.50;2026-09-10\r\n',
    );
    expect(result.errors).toEqual([]);
    expect(result.rows[0].name).toBe('Pessoa; Fictícia');
  });
  it('salva uma vez e reverte todo o lote em caso de duplicidade', async () => {
    const before = await demoAdapter.read();
    await ImportService.commit(scope, 'pt-1', csv, 'demo.csv');
    expect((await demoAdapter.read()).debts.length).toBe(before.debts.length + 1);
    await expect(
      ImportService.commit(
        scope,
        'pt-1',
        csv.replace('NOVO-999', 'OUTRO-999') + '\nDEMO-888;Outra Pessoa;NOVO-999;100;2026-09-10',
        'demo.csv',
      ),
    ).rejects.toThrow('já existe');
    expect((await demoAdapter.read()).debts.length).toBe(before.debts.length + 1);
  });
  it('neutraliza fórmulas em exportações', async () => {
    expect(csvCell('=HYPERLINK("x")')).toBe('"\'=HYPERLINK(""x"")"');
  });
});

describe('aprovação excepcional simulada', () => {
  it('exige administrador e mantém o limite máximo da política', async () => {
    const p = await NegotiationService.propose(scope, 'dt-10', 25, 0, 2);
    expect(p.status).toBe('Aguardando aprovação');
    await expect(NegotiationService.confirm(scope, 'dt-10', 25, 0, 2, p.id)).rejects.toThrow(
      'indisponível',
    );
    await expect(NegotiationService.approve({ ...scope, role: 'Operador' }, p.id)).rejects.toThrow(
      'perfil',
    );
    await NegotiationService.approve(scope, p.id);
    const a = await NegotiationService.confirm(scope, 'dt-10', 25, 0, 2, p.id);
    expect(a.proposalId).toBe(p.id);
    expect(
      (await demoAdapter.read()).proposals.find((v) => v.id === p.id)?.approvedBy,
    ).toBeTruthy();
    await expect(NegotiationService.propose(scope, 'dt-11', 99, 0, 2)).rejects.toThrow('máximo');
  });
  it('revalida política e condições depois de aprovar', async () => {
    const p = await NegotiationService.propose(scope, 'dt-10', 25, 0, 2);
    await NegotiationService.approve(scope, p.id);
    await expect(NegotiationService.confirm(scope, 'dt-10', 25, 0, 3, p.id)).rejects.toThrow(
      'condições',
    );
    await withDatabase('readwrite', (db) => {
      db.creditors[0].policy.maxDiscount = 20;
    });
    await expect(NegotiationService.confirm(scope, 'dt-10', 25, 0, 2, p.id)).rejects.toThrow(
      'máximo',
    );
  });
});
