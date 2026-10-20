import { beforeEach, describe, expect, it } from 'vitest';
import { demoAdapter, withDatabase, storageKey } from '../services/persistence';
import { seed } from '../mocks/seed';
import { NegotiationService } from '../services/operations';
beforeEach(async () => {
  localStorage.clear();
  await demoAdapter.reset();
});
describe('integridade da persistência', () => {
  it('recusa soma financeira e vínculos inconsistentes sem gravar parcialmente', async () => {
    const before = await demoAdapter.read();
    await expect(
      withDatabase('readwrite', (db) => {
        db.installments[0].amount++;
      }),
    ).rejects.toThrow();
    await expect(
      withDatabase('readwrite', (db) => {
        db.debts[0].portfolioId = 'inexistente';
      }),
    ).rejects.toThrow();
    expect(await demoAdapter.read()).toEqual(before);
  });
  it('migra a cópia legada sem perda e preserva o original', async () => {
    await new Promise<void>((resolve, reject) => {
      const r = indexedDB.deleteDatabase(storageKey);
      r.onsuccess = () => resolve();
      r.onerror = () => reject(r.error);
    });
    const legacy = seed();
    legacy.portfolios[0].name = 'Carteira legada preservada';
    const original = JSON.stringify(legacy);
    localStorage.setItem(storageKey, original);
    expect((await demoAdapter.read()).portfolios[0].name).toBe('Carteira legada preservada');
    await NegotiationService.confirm(
      { creditorId: 'cr-1', role: 'Administrador' },
      'dt-10',
      10,
      0,
      2,
    );
    const saved = await demoAdapter.read();
    expect(saved.portfolios[0].name).toBe('Carteira legada preservada');
    expect(saved.agreements).toHaveLength(legacy.agreements.length + 1);
    expect(localStorage.getItem(storageKey)).toBe(original);
    localStorage.setItem(storageKey, 'cópia legada alterada depois da migração');
    expect((await demoAdapter.read()).agreements).toHaveLength(saved.agreements.length);
  });
});
