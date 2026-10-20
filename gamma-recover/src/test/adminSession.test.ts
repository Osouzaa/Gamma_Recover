import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  adminSessionKey,
  adminReturnPath,
  closeAdminSession,
  readAdminSession,
  signInAdmin,
} from '../services/adminSession';
import { demoAdapter } from '../services/persistence';
beforeEach(async () => {
  localStorage.clear();
  await demoAdapter.reset();
});
describe('sessão administrativa demonstrativa', () => {
  it('começa sem sessão e rejeita credenciais inválidas sem alterar a base', async () => {
    expect(readAdminSession()).toBeNull();
    const before = await demoAdapter.read();
    await expect(signInAdmin({ email: 'admin@gamma.demo', password: 'errada' })).rejects.toThrow(
      'inválidos',
    );
    expect(await demoAdapter.read()).toEqual(before);
    expect(readAdminSession()).toBeNull();
  });
  it.each([
    ['admin@gamma.demo', 'Administrador'],
    ['operador@gamma.demo', 'Operador'],
    ['financeiro@gamma.demo', 'Financeiro'],
  ])('entra como %s e preserva os valores financeiros', async (email, role) => {
    const before = await demoAdapter.read();
    await signInAdmin({ email, password: 'Gamma@123' });
    expect(readAdminSession()?.email).toBe(email);
    const after = await demoAdapter.read();
    expect(after.settings.role).toBe(role);
    expect(after.debts).toEqual(before.debts);
    expect(after.agreements).toEqual(before.agreements);
    expect(after.installments).toEqual(before.installments);
    expect(localStorage.getItem(adminSessionKey)).not.toContain('Gamma@123');
  });
  it('encerra a sessão sem apagar os dados demonstrativos', async () => {
    await signInAdmin({ email: 'admin@gamma.demo', password: 'Gamma@123' });
    const before = await demoAdapter.read();
    closeAdminSession();
    expect(readAdminSession()).toBeNull();
    expect(await demoAdapter.read()).toEqual(before);
  });
  it('recusa sessões expiradas ou malformadas', () => {
    localStorage.setItem(
      adminSessionKey,
      JSON.stringify({ version: 1, email: 'admin@gamma.demo', expires: Date.now() - 1 }),
    );
    expect(readAdminSession()).toBeNull();
    localStorage.setItem(adminSessionKey, 'invalid');
    expect(readAdminSession()).toBeNull();
  });
  it('não confirma entrada quando o armazenamento falha', async () => {
    const write = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Sem armazenamento');
    });
    try {
      await expect(
        signInAdmin({ email: 'admin@gamma.demo', password: 'Gamma@123' }),
      ).rejects.toThrow('Não foi possível abrir');
      expect(readAdminSession()).toBeNull();
    } finally {
      write.mockRestore();
    }
  });
  it.each(['https://evil.invalid', '//evil.invalid', '/\\evil.invalid', '/login', '/portal'])(
    'descarta retorno inseguro ou fora do painel: %s',
    (from) => expect(adminReturnPath(from)).toBe('/'),
  );
  it('preserva a rota administrativa e a consulta após a entrada', () =>
    expect(adminReturnPath('/acordos?acordo=ac-1#parcelas')).toBe('/acordos?acordo=ac-1#parcelas'));
});
