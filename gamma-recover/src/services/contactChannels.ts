import { z } from 'zod';
import type { Debtor } from '../types/domain';
export const contactChannels = ['WhatsApp', 'Telefone', 'E-mail'] as const;
export type ContactChannel = (typeof contactChannels)[number];
export const attendanceChannelSchema = z.enum([...contactChannels, 'Registro interno']);
export function phoneDigits(value: string) {
  if (!/^[+\d().\s-]+$/.test(value)) return '';
  let digits = value.replace(/\D/g, '');
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55'))
    digits = digits.slice(2);
  if (!/^[1-9]\d(?:[2-5]\d{7}|9\d{8})$/.test(digits)) return '';
  return `55${digits}`;
}
export function contactDestination(
  debtor: Pick<Debtor, 'phone' | 'email' | 'whatsapp'>,
  channel: ContactChannel,
) {
  if (channel === 'Telefone') return phoneDigits(debtor.phone);
  if (channel === 'WhatsApp') return phoneDigits(debtor.whatsapp || '');
  const email = debtor.email.trim().toLowerCase();
  if (
    !z.email().safeParse(email).success ||
    /@(?:.*\.)?(?:example\.(?:com|org|net)|invalid|test|example|localhost)$/.test(email)
  )
    return '';
  return email;
}
export function contactHref(debtor: Debtor, channel: ContactChannel) {
  const value = contactDestination(debtor, channel);
  if (!value) return undefined;
  return channel === 'WhatsApp'
    ? `https://wa.me/${value}`
    : channel === 'Telefone'
      ? `tel:+${value}`
      : `mailto:${value}`;
}
export const contactPhoneSchema = z
  .string()
  .trim()
  .max(30)
  .refine(
    (value) => !value || !!phoneDigits(value),
    'Informe telefone brasileiro com DDD ou deixe em branco.',
  );
export const contactEmailSchema = z
  .union([z.literal(''), z.email('Informe um e-mail válido.')])
  .transform((value) => value.toLowerCase());
export const debtorContactsSchema = z
  .object({
    phone: contactPhoneSchema,
    whatsapp: contactPhoneSchema,
    email: z.string().trim().max(150).pipe(contactEmailSchema),
    preferredChannel: z.union([z.enum(contactChannels), z.literal('')]),
  })
  .refine((v) => !v.preferredChannel || !!contactDestination(v, v.preferredChannel), {
    path: ['preferredChannel'],
    message: 'Cadastre um endereço utilizável para o canal preferencial.',
  });
