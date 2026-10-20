import { z } from 'zod';
export const taskInputSchema = z.object({
  debtId: z.string().min(1),
  title: z.string().trim().min(5, 'Descreva a tarefa com pelo menos 5 caracteres.').max(200),
  dueDate: z.iso.date(),
});
export const taskSchema = taskInputSchema
  .extend({
    id: z.string().min(1),
    responsible: z.string().min(1),
    createdAt: z.iso.datetime(),
    sourceContactId: z.string().optional(),
    completedAt: z.iso.datetime().optional(),
    completedBy: z.string().min(1).optional(),
  })
  .refine((task) => !!task.completedAt === !!task.completedBy, 'Conclusão da tarefa incompleta.');
export type Task = z.infer<typeof taskSchema>;
