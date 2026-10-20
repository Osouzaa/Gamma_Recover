import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useWorkspace } from '../../app/providers/Context';
import { useAction } from '../../hooks/useDatabase';
import { CreditorService, creditorSchema } from '../../services/admin';
import type { Creditor } from '../../types/domain';
import { Modal } from '../../components/Modal';
import { Feedback } from '../../components/Feedback';
import { Button, Field, Form, Input } from '../../components/ui';
export function CreditorForm({
  creditor,
  onClose,
}: {
  creditor: Creditor | null;
  onClose: () => void;
}) {
  const { scope } = useWorkspace();
  const action = useAction();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(
      creditorSchema.extend({
        policy: creditorSchema.shape.policy.extend({ minInstallment: z.number().min(1) }),
      }),
    ),
    defaultValues: creditor
      ? {
          name: creditor.name,
          document: creditor.document,
          policy: {
            ...creditor.policy,
            approvalAbove: creditor.policy.approvalAbove ?? creditor.policy.maxDiscount,
            minInstallment: creditor.policy.minInstallment / 100,
          },
        }
      : {
          name: '',
          document: 'DEMO-',
          policy: { maxDiscount: 20, approvalAbove: 10, maxInstallments: 12, minInstallment: 50 },
        },
  });
  return (
    <Modal title={creditor ? 'Editar credor e política' : 'Novo credor fictício'} onClose={onClose}>
      <Form
        onSubmit={handleSubmit((v) =>
          action.mutate(
            () =>
              CreditorService.save(
                scope,
                {
                  ...v,
                  policy: {
                    ...v.policy,
                    minInstallment: Math.round(v.policy.minInstallment * 100),
                  },
                },
                creditor?.id,
              ),
            { onSuccess: onClose },
          ),
        )}
      >
        <Field>
          Nome do credor
          <Input {...register('name')} />
          <small>{errors.name?.message}</small>
        </Field>
        <Field>
          Documento fictício
          <Input {...register('document')} />
          <small>{errors.document?.message}</small>
        </Field>
        <Field>
          Desconto máximo (%)
          <Input
            type="number"
            min="0"
            max="80"
            {...register('policy.maxDiscount', { valueAsNumber: true })}
          />
          <small>{errors.policy?.maxDiscount?.message}</small>
        </Field>
        <Field>
          Desconto sem aprovação (%)
          <Input
            type="number"
            min="0"
            max="80"
            {...register('policy.approvalAbove', { valueAsNumber: true })}
          />
          <small>{errors.policy?.approvalAbove?.message}</small>
        </Field>
        <Field>
          Máximo de parcelas
          <Input
            type="number"
            min="1"
            max="36"
            {...register('policy.maxInstallments', { valueAsNumber: true })}
          />
          <small>{errors.policy?.maxInstallments?.message}</small>
        </Field>
        <Field>
          Parcela mínima (R$)
          <Input
            type="number"
            min="1"
            step="0.01"
            {...register('policy.minInstallment', { valueAsNumber: true })}
          />
          <small>{errors.policy?.minInstallment?.message}</small>
        </Field>
        <Feedback error={action.error} />
        <Button $variant="primary" disabled={action.isPending}>
          Salvar credor e política
        </Button>
      </Form>
    </Modal>
  );
}
