import { z } from 'zod';
export const journeyChannels = ['E-mail', 'WhatsApp', 'Telefone', 'Tarefa interna'] as const;
export const journeyInputSchema = z
  .object({
    creditorId: z.string().min(1),
    name: z.string().trim().min(3).max(100),
    active: z.boolean(),
    steps: z
      .array(
        z.object({
          offset: z.number().int().min(-90).max(365),
          channel: z.enum(journeyChannels),
          note: z.string().trim().min(5).max(500),
        }),
      )
      .min(1)
      .max(10),
  })
  .refine(
    (j) => new Set(j.steps.map((s) => `${s.offset}|${s.channel}`)).size === j.steps.length,
    'Não repita o canal no mesmo dia da régua.',
  );
export const journeySchema = journeyInputSchema.safeExtend({
  id: z.string().min(1),
  revision: z.number().int().positive(),
  updatedAt: z.iso.datetime(),
});
export const journeyRunSchema = z.object({
  id: z.string().min(1),
  journeyId: z.string().min(1),
  revision: z.number().int().positive(),
  date: z.iso.date(),
  actor: z.string().min(1),
  results: z.array(
    z.object({
      debtId: z.string().min(1),
      channel: z.enum(journeyChannels),
      note: z.string().min(5).max(500),
      step: z.number().int().nonnegative(),
      scheduledDate: z.iso.date(),
      reason: z.string(),
      eligible: z.boolean(),
    }),
  ),
});
export type Journey = z.infer<typeof journeySchema>;
export type JourneyInput = z.infer<typeof journeyInputSchema>;
export type JourneyRun = z.infer<typeof journeyRunSchema>;
