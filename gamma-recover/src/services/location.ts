import { z } from 'zod';
export const states = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
] as const;
export const locationSchema = z.object({
  city: z.string().trim().min(2, 'Informe a cidade.').max(100),
  state: z.enum(states, { error: 'Selecione uma UF válida.' }),
});
export type Location = z.infer<typeof locationSchema>;
export const locationKey = (location?: Location) =>
  location
    ? `${location.city
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase('pt-BR')}|${location.state}`
    : 'unknown';
export const locationLabel = (location?: Location) =>
  location ? `${location.city} / ${location.state}` : 'Localização não informada';
