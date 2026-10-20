import type { Database } from '../types/domain';
import { addMonths, today } from '../utils/format';
export function seed(): Database {
  const now = today();
  const locations = [
    { city: 'São Paulo', state: 'SP' as const },
    { city: 'Campinas', state: 'SP' as const },
    { city: 'Rio de Janeiro', state: 'RJ' as const },
    { city: 'Belo Horizonte', state: 'MG' as const },
    { city: 'Curitiba', state: 'PR' as const },
    { city: 'Salvador', state: 'BA' as const },
  ];
  const names = [
    'Marina Exemplo',
    'Rafael Modelo',
    'Beatriz Teste',
    'Lucas Fictício',
    'Camila Demonstração',
    'Pedro Exemplo',
    'Helena Modelo',
    'Bruno Teste',
    'Sofia Fictícia',
    'André Demonstração',
    'Laura Exemplo',
    'Diego Modelo',
    'Ana Teste',
    'Felipe Fictício',
    'Clara Demonstração',
    'Gabriel Exemplo',
    'Isabela Modelo',
    'Thiago Teste',
    'Luiza Fictícia',
    'Daniel Demonstração',
    'Julia Exemplo',
    'Caio Modelo',
    'Alice Teste',
    'Igor Fictício',
  ];
  const db: Database = {
    version: 1,
    creditors: [
      {
        id: 'cr-1',
        name: 'Horizonte Financeira · fictícia',
        document: 'DEMO-001',
        policy: { maxDiscount: 30, approvalAbove: 20, maxInstallments: 12, minInstallment: 5000 },
      },
      {
        id: 'cr-2',
        name: 'Vértice Educação · fictícia',
        document: 'DEMO-002',
        policy: { maxDiscount: 20, approvalAbove: 10, maxInstallments: 8, minInstallment: 8000 },
      },
    ],
    portfolios: [
      { id: 'pt-1', creditorId: 'cr-1', name: 'Crédito pessoal', active: true, createdAt: now },
      { id: 'pt-2', creditorId: 'cr-1', name: 'Varejo e serviços', active: true, createdAt: now },
      { id: 'pt-3', creditorId: 'cr-2', name: 'Mensalidades', active: true, createdAt: now },
    ],
    debtors: names.map((name, i) => ({
      id: `dv-${i + 1}`,
      name,
      document: `DEMO-${String(i + 1).padStart(4, '0')}`,
      email: `pessoa${i + 1}@example.invalid`,
      phone: '(00) 00000-0000',
      blocked: false,
      ...(i % 8 < 6 ? { location: locations[i % 8] } : {}),
    })),
    debts: names.map((_, i) => ({
      id: `dt-${i + 1}`,
      portfolioId: `pt-${(i % 3) + 1}`,
      debtorId: `dv-${i + 1}`,
      reference: `CTR-DEMO-${1000 + i}`,
      amount: 125000 + i * 47321,
      dueDate: addMonths(now, -((i % 8) + 1)),
      disputed: false,
    })),
    contacts: [],
    proposals: [],
    agreements: [],
    installments: [],
    campaigns: [],
    audit: [],
    imports: [],
    disputes: [],
    settings: { operatorName: 'Ana Operadora · demo', role: 'Administrador', returnDays: 3 },
  };
  for (let i = 0; i < 9; i++) {
    const debt = db.debts[i];
    const total = debt.amount - Math.round(debt.amount * 0.1);
    db.proposals.push({
      id: `pr-${i + 1}`,
      debtId: debt.id,
      discount: 10,
      entry: 0,
      count: 4,
      total,
      createdAt: addMonths(now, -3),
      status: 'Aceita',
    });
    db.agreements.push({
      id: `ac-${i + 1}`,
      debtId: debt.id,
      proposalId: `pr-${i + 1}`,
      total,
      createdAt: addMonths(now, -3),
      cancelled: i === 8,
      broken: i === 7,
      acceptedBy: 'Operação demonstrativa',
    });
    for (let n = 0; n < 4; n++)
      db.installments.push({
        id: `pc-${i + 1}-${n + 1}`,
        agreementId: `ac-${i + 1}`,
        number: n + 1,
        amount: Math.floor(total / 4) + (n === 3 ? total % 4 : 0),
        dueDate: addMonths(now, n - 2),
        ...(n < 2 && i % 3 !== 0 && i < 8
          ? { paidAt: addMonths(now, n - 2), paymentReference: `DEMO-${i}-${n}` }
          : {}),
      });
  }
  db.contacts.push({
    id: 'ct-1',
    debtorId: 'dv-10',
    creditorId: 'cr-1',
    result: 'Retorno agendado',
    note: 'Solicitou contato no próximo dia útil. Registro fictício.',
    date: new Date().toISOString(),
    nextDate: now,
    closed: false,
  });
  return db;
}
