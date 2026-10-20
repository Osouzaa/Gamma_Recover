import { afterEach, expect, it, vi } from 'vitest';
import { id } from '../utils/format';
import { signInAdmin, readAdminSession } from '../services/adminSession';
import { demoAdapter } from '../services/persistence';

afterEach(() => vi.unstubAllGlobals());

it('rejects missing secure randomness', () => {
  vi.stubGlobal('crypto', undefined);
  expect(() => id('au')).toThrow('identificadores seguros');
});

it('preserves the native UUID and prefix', () => {
  vi.stubGlobal('crypto', { randomUUID: () => 'native-uuid' });
  expect(id('au')).toBe('au-native-uuid');
});

it('generates distinct v4 UUIDs without randomUUID', () => {
  vi.stubGlobal('crypto', { getRandomValues: crypto.getRandomValues.bind(crypto) });
  const ids = Array.from({ length: 100 }, () => id('au'));
  expect(new Set(ids).size).toBe(100);
  for (const value of ids)
    expect(value).toMatch(
      /^au-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
});

it('signs in and persists audit without randomUUID or financial changes', async () => {
  localStorage.clear();
  await demoAdapter.reset();
  const before = await demoAdapter.read();
  vi.stubGlobal('crypto', { getRandomValues: crypto.getRandomValues.bind(crypto) });
  await signInAdmin({ email: 'admin@gamma.demo', password: 'Gamma@123' });
  expect(readAdminSession()?.email).toBe('admin@gamma.demo');
  const after = await demoAdapter.read();
  expect(after.audit).toHaveLength(before.audit.length + 1);
  expect(after.audit[0].id).toMatch(/^au-/);
  expect(after.debts).toEqual(before.debts);
  expect(after.agreements).toEqual(before.agreements);
  expect(after.installments).toEqual(before.installments);
});
