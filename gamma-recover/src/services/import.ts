import { locationKey, locationSchema, type Location } from './location';
import { z } from 'zod';
import {
  contactPhoneSchema,
  contactEmailSchema,
  contactDestination,
  phoneDigits,
  type ContactChannel,
} from './contactChannels';
import { id, today } from '../utils/format';
import { requireRole, transact, type Scope } from './store';
export interface ImportRow {
  document: string;
  name: string;
  reference: string;
  amount: number;
  dueDate: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  location?: Location;
}
const rowSchema = z.object({
  document: z.string().regex(/^DEMO-[A-Za-z0-9-]+$/, 'Use identificador fictício DEMO-...'),
  name: z.string().trim().min(3).max(100),
  reference: z.string().trim().min(2).max(100),
  amount: z.number().int().positive().max(100000000000),
  dueDate: z.iso.date(),
  phone: contactPhoneSchema.optional(),
  whatsapp: contactPhoneSchema.optional(),
  email: contactEmailSchema.optional(),
  location: locationSchema.optional(),
});
export function parseCSV(text: string): { rows: ImportRow[]; errors: string[] } {
  if (text.length > 1000000) return { rows: [], errors: ['Arquivo excede 1 MB.'] };
  const records: string[][] = [];
  let record: string[] = [];
  let value = '';
  let quoted = false;
  const source = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if (c === '"') {
      if (quoted && source[i + 1] === '"') {
        value += '"';
        i++;
      } else quoted = !quoted;
    } else if (c === ';' && !quoted) {
      record.push(value);
      value = '';
    } else if ((c === '\n' || c === '\r') && !quoted) {
      if (c === '\r' && source[i + 1] === '\n') i++;
      record.push(value);
      if (record.some((v) => v.trim())) records.push(record);
      record = [];
      value = '';
    } else value += c;
  }
  if (quoted) return { rows: [], errors: ['Aspas não encerradas no CSV.'] };
  record.push(value);
  if (record.some((v) => v.trim())) records.push(record);
  const header = records.shift()?.join(';').trim();
  const withLocation =
    header === 'documento;nome;contrato;valor;vencimento;telefone;whatsapp;email;cidade;uf';
  const withChannels =
    withLocation || header === 'documento;nome;contrato;valor;vencimento;telefone;whatsapp;email';
  if (!withChannels && header !== 'documento;nome;contrato;valor;vencimento')
    return {
      rows: [],
      errors: ['Cabeçalho obrigatório: documento;nome;contrato;valor;vencimento'],
    };
  const rows: ImportRow[] = [];
  const errors: string[] = [];
  const references = new Set<string>();
  records.forEach((r, i) => {
    const amount = /^\d+(?:[.,]\d{1,2})?$/.test(r[3] || '')
      ? Math.round(Number(r[3].replace(',', '.')) * 100)
      : NaN;
    const result = rowSchema.safeParse({
      document: r[0]?.trim(),
      name: r[1]?.trim(),
      reference: r[2]?.trim(),
      amount,
      dueDate: r[4]?.trim(),
      ...(withLocation && (r[8]?.trim() || r[9]?.trim())
        ? { location: { city: r[8]?.trim(), state: r[9]?.trim().toUpperCase() } }
        : {}),
      ...(withChannels ? { phone: r[5]?.trim(), whatsapp: r[6]?.trim(), email: r[7]?.trim() } : {}),
    });
    if (r.length !== (withLocation ? 10 : withChannels ? 8 : 5) || !result.success) {
      errors.push(
        `Linha ${i + 2}: ${result.success ? `esperadas ${withLocation ? 10 : withChannels ? 8 : 5} colunas` : result.error.issues.map((e) => e.message).join('; ')}`,
      );
    } else if (references.has(result.data.reference))
      errors.push(`Linha ${i + 2}: contrato duplicado no arquivo.`);
    else {
      references.add(result.data.reference);
      rows.push(result.data);
    }
  });
  if (!records.length) errors.push('Arquivo sem registros.');
  if (records.length > 1000) errors.push('Limite de 1.000 registros por importação.');
  return { rows, errors };
}
export const ImportService = {
  commit(scope: Scope, portfolioId: string, text: string, filename: string) {
    return transact('CSV importado', portfolioId, scope, (db) => {
      requireRole(scope, ['Administrador'], db);
      const p = db.portfolios.find((p) => p.id === portfolioId);
      if (!p || !p.active || (scope.creditorId && scope.creditorId !== p.creditorId))
        throw new Error('Carteira indisponível.');
      const preview = parseCSV(text);
      if (preview.errors.length) throw new Error('Corrija todos os erros antes de importar.');
      for (const row of preview.rows) {
        rowSchema.parse(row);
        if (
          db.debts.some(
            (d) =>
              d.reference === row.reference &&
              db.portfolios.some(
                (owner) => owner.id === d.portfolioId && owner.creditorId === p.creditorId,
              ),
          )
        )
          throw new Error(`Contrato ${row.reference} já existe.`);
        let debtor = db.debtors.find((d) => d.document === row.document);
        if (debtor && debtor.name !== row.name)
          throw new Error(`Nome divergente para ${row.document}.`);
        if (!debtor) {
          debtor = {
            id: id('dv'),
            document: row.document,
            name: row.name,
            email: '',
            phone: '',
            blocked: false,
          };
          db.debtors.push(debtor);
        }
        if (row.location) {
          if (debtor.location && locationKey(debtor.location) !== locationKey(row.location))
            throw new Error(
              `Localização divergente para ${row.document}. Revise o cadastro antes de importar.`,
            );
          if (!debtor.location) debtor.location = row.location;
        }
        const fields: [ContactChannel, 'phone' | 'whatsapp' | 'email'][] = [
          ['Telefone', 'phone'],
          ['WhatsApp', 'whatsapp'],
          ['E-mail', 'email'],
        ];
        for (const [channel, field] of fields) {
          const incoming = row[field];
          if (!incoming) continue;
          const existing = contactDestination(debtor, channel);
          const normalized = field === 'email' ? incoming.toLowerCase() : phoneDigits(incoming);
          if (existing && existing !== normalized)
            throw new Error(
              `${channel} divergente para ${row.document}. Revise o cadastro antes de importar.`,
            );
          if (!existing) debtor[field] = incoming;
        }
        db.debts.push({
          id: id('dt'),
          portfolioId,
          debtorId: debtor.id,
          reference: row.reference,
          amount: row.amount,
          dueDate: row.dueDate,
          disputed: false,
        });
      }
      db.imports.unshift({
        id: id('im'),
        portfolioId,
        date: today(),
        count: preview.rows.length,
        filename,
        actor: db.settings.operatorName,
      });
      return preview.rows.length;
    });
  },
};
