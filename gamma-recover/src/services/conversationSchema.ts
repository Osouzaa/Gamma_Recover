import { z } from 'zod';
export const chatTextSchema = z
  .string()
  .trim()
  .min(1, 'Escreva a mensagem.')
  .max(4096, 'Limite de 4.096 caracteres.');
export const conversationSchema = z.object({
  id: z.string().min(1),
  creditorId: z.string().min(1),
  debtorId: z.string().min(1),
  destination: z.string().regex(/^55[1-9]\d(?:[2-5]\d{7}|9\d{8})$/),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  drafts: z.array(
    z.object({
      id: z.string().min(1),
      debtId: z.string().min(1),
      text: chatTextSchema,
      actor: z.string().min(1),
      createdAt: z.iso.datetime(),
      updatedAt: z.iso.datetime(),
    }),
  ),
});
