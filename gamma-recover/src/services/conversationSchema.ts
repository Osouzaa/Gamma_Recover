import { z } from 'zod';
export const chatTextSchema = z
  .string()
  .trim()
  .min(1, 'Escreva a mensagem.')
  .max(4096, 'Limite de 4.096 caracteres.');
const draftSchema = z.object({
  id: z.string().min(1),
  debtId: z.string().min(1),
  text: chatTextSchema,
  actor: z.string().min(1),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  subject: z.string().trim().max(150).optional(),
});
export const conversationSchema = z
  .object({
    id: z.string().min(1),
    creditorId: z.string().min(1),
    debtorId: z.string().min(1),
    destination: z.string().min(1),
    channel: z.enum(['WhatsApp', 'E-mail', 'SMS']).optional(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
    drafts: z.array(draftSchema),
    simulations: z
      .array(draftSchema.extend({ outcome: z.enum(['Envio simulado', 'Falha simulada']) }))
      .optional(),
  })
  .superRefine((conversation, ctx) => {
    const channel = conversation.channel ?? 'WhatsApp';
    const valid =
      channel === 'E-mail'
        ? z.email().safeParse(conversation.destination).success
        : channel === 'SMS'
          ? /^55[1-9]\d9\d{8}$/.test(conversation.destination)
          : /^55[1-9]\d(?:[2-5]\d{7}|9\d{8})$/.test(conversation.destination);
    if (!valid) ctx.addIssue({ code: 'custom', message: 'Destino inválido para o canal.' });
    for (const message of [...conversation.drafts, ...(conversation.simulations ?? [])]) {
      if (channel === 'SMS' && message.text.length > 160)
        ctx.addIssue({ code: 'custom', message: 'SMS demonstrativo limitado a 160 caracteres.' });
      if (channel === 'E-mail' && !message.subject?.trim())
        ctx.addIssue({ code: 'custom', message: 'Informe o assunto do e-mail.' });
    }
  });
