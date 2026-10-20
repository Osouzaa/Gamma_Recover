import { beforeEach, expect, it } from 'vitest';
import { CreditorService } from '../services/admin';
import { emptyCompanyProfile, readContract } from '../services/companySchema';
import { demoAdapter, withDatabase } from '../services/persistence';
import { ImportService } from '../services/import';
import { PortfolioService } from '../services/operations';
import { adminReturnPath } from '../services/adminSession';
const scope = { creditorId: '', role: 'Administrador' as const };
const values = () => ({
  name: 'Empresa Exemplo fictícia',
  document: 'DEMO-CNPJ-999',
  policy: { maxDiscount: 20, approvalAbove: 10, maxInstallments: 12, minInstallment: 5000 },
  profile: {
    ...structuredClone(emptyCompanyProfile),
    contactName: 'Contato Fictício',
    phone: '(00) 00000-0000',
    email: 'contato@example.invalid',
    manager: 'Gestora Exemplo',
  },
});
beforeEach(async () => {
  localStorage.clear();
  await demoAdapter.reset();
});
it('complements legacy companies, preserves financial data and records company audit', async () => {
  const before = await demoAdapter.read();
  const company = before.creditors[0];
  const input = {
    ...values(),
    name: company.name,
    document: company.document,
    policy: company.policy,
  };
  input.profile.contract.attachment = await readContract(
    new File(['%PDF-1.4\n% ficticio'], 'contrato.pdf', { type: 'application/pdf' }),
  );
  await CreditorService.save(scope, input, company.id);
  const after = await demoAdapter.read();
  expect(after.creditors[0].profile).toEqual(input.profile);
  expect(after.debts).toEqual(before.debts);
  expect(after.agreements).toEqual(before.agreements);
  expect(after.installments).toEqual(before.installments);
  expect(after.portfolios).toEqual(before.portfolios);
  expect(after.audit[0]).toMatchObject({ entityId: company.id, creditorId: company.id });
  await CreditorService.save(
    scope,
    {
      name: company.name,
      document: company.document,
      policy: { ...company.policy, maxDiscount: 40 },
    },
    company.id,
  );
  expect((await demoAdapter.read()).creditors[0].profile).toEqual(input.profile);
});
it('company edits preserve the latest policy from another operation', async () => {
  const before = await demoAdapter.read();
  const company = before.creditors[0];
  await CreditorService.save(
    scope,
    { ...company, policy: { ...company.policy, maxDiscount: 45 } },
    company.id,
  );
  const { policy: _policy, ...input } = values();
  void _policy;
  await CreditorService.saveCompany(
    scope,
    { ...input, name: company.name, document: company.document },
    company.id,
  );
  expect((await demoAdapter.read()).creditors[0].policy.maxDiscount).toBe(45);
});
it('rejects invalid contacts, dates, duplicates and unauthorized company writes atomically', async () => {
  const input = values();
  await CreditorService.save(scope, input);
  const before = await demoAdapter.read();
  await expect(CreditorService.save(scope, input)).rejects.toThrow('já cadastrado');
  await expect(CreditorService.save({ ...scope, role: 'Operador' }, input)).rejects.toThrow(
    'perfil',
  );
  await expect(
    CreditorService.save({ ...scope, creditorId: 'cr-2' }, input, 'cr-1'),
  ).rejects.toThrow();
  await expect(
    CreditorService.save(scope, { ...input, profile: { ...input.profile, email: 'invalid' } }),
  ).rejects.toThrow();
  input.profile.contract.startDate = '2026-10-01';
  input.profile.contract.endDate = '2026-09-01';
  await expect(CreditorService.save(scope, input)).rejects.toThrow('vigência');
  expect(await demoAdapter.read()).toEqual(before);
});
it('links imports to their company, reuses a person across companies and isolates duplicate references', async () => {
  const csv =
    'documento;nome;contrato;valor;vencimento\nDEMO-PESSOA-999;Pessoa Exemplo;MESMA-REF;150,00;2026-10-01';
  await ImportService.commit(scope, 'pt-1', csv, 'empresa-1.csv');
  await ImportService.commit(scope, 'pt-3', csv, 'empresa-2.csv');
  const db = await demoAdapter.read();
  const debts = db.debts.filter((d) => d.reference === 'MESMA-REF');
  expect(debts).toHaveLength(2);
  expect(new Set(debts.map((d) => d.debtorId)).size).toBe(1);
  expect(db.imports[0]).toMatchObject({
    portfolioId: 'pt-3',
    filename: 'empresa-2.csv',
    actor: db.settings.operatorName,
  });
  await expect(ImportService.commit(scope, 'pt-2', csv, 'duplicado.csv')).rejects.toThrow(
    'já existe',
  );
  await expect(
    ImportService.commit({ ...scope, creditorId: 'cr-1' }, 'pt-3', csv, 'fora.csv'),
  ).rejects.toThrow('indisponível');
  expect(await demoAdapter.read()).toEqual(db);
});
it('rejects orphan imports, missing companies and portfolio transfers without changing the database', async () => {
  const before = await demoAdapter.read();
  await expect(
    PortfolioService.save(scope, { name: 'Carteira teste', active: true, creditorId: '' }),
  ).rejects.toThrow();
  await expect(
    PortfolioService.save(
      scope,
      { name: 'Carteira teste', active: true, creditorId: 'cr-2' },
      'pt-1',
    ),
  ).rejects.toThrow('transferir');
  await expect(
    withDatabase('readwrite', (db) => {
      db.imports.push({
        id: 'orphan',
        portfolioId: 'missing',
        filename: 'x.csv',
        date: '2026-10-01',
        count: 1,
      });
    }),
  ).rejects.toThrow('sem carteira');
  expect(await demoAdapter.read()).toEqual(before);
  expect(adminReturnPath('/empresas')).toBe('/empresas');
});
it('rejects disguised or oversized attachments', async () => {
  await expect(readContract(new File(['invalid'], 'x.pdf'))).rejects.toThrow('PDF válido');
  await expect(readContract(new File(['%PDF-test'], 'x.html'))).rejects.toThrow('PDF de até');
  await expect(readContract(new File([new Uint8Array(2000001)], 'x.pdf'))).rejects.toThrow(
    'PDF de até',
  );
});
