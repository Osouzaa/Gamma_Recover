import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Debtor } from '../../types/domain';
import { useWorkspace } from '../../app/providers/Context';
import { useAction } from '../../hooks/useDatabase';
import { contactChannels, debtorContactsSchema } from '../../services/contactChannels';
import { DebtorContactService } from '../../services/debtorContacts';
import { Modal } from '../../components/Modal';
import { Feedback } from '../../components/Feedback';
import { Alert, Button, Field, Form, Input, Select } from '../../components/ui';
export function DebtorContactForm({
  debtor,
  debtId,
  onClose,
}: {
  debtor: Debtor;
  debtId: string;
  onClose: () => void;
}) {
  const { scope } = useWorkspace();
  const action = useAction();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(debtorContactsSchema),
    defaultValues: {
      phone: debtor.phone === '(00) 00000-0000' ? '' : debtor.phone,
      whatsapp: debtor.whatsapp || '',
      email: debtor.email,
      preferredChannel: debtor.preferredChannel || ('' as const),
    },
  });
  return (
    <Modal title="Editar canais do contribuinte" onClose={onClose}>
      <Form
        onSubmit={handleSubmit((values) =>
          action.mutate(() => DebtorContactService.save(scope, debtId, values), {
            onSuccess: onClose,
          }),
        )}
      >
        <p>
          {debtor.name} · {debtor.document}
        </p>
        <Alert>
          Use somente dados fictícios nesta demonstração. Os canais pertencem à pessoa e são
          compartilhados entre seus contratos e empresas. Deixe em branco o que não foi informado.
        </Alert>
        <Field>
          Telefone com DDD
          <Input type="tel" autoFocus placeholder="DDD + número" {...register('phone')} />
          <small>{errors.phone?.message}</small>
        </Field>
        <Field>
          WhatsApp com DDD
          <Input
            type="tel"
            placeholder="Cadastre somente se houver WhatsApp"
            {...register('whatsapp')}
          />
          <small>{errors.whatsapp?.message}</small>
        </Field>
        <Field>
          E-mail de contato
          <Input type="email" {...register('email')} />
          <small>{errors.email?.message}</small>
        </Field>
        <Field>
          Canal preferencial
          <Select aria-label="Canal preferencial" {...register('preferredChannel')}>
            <option value="">Sem preferência informada</option>
            {contactChannels.map((channel) => (
              <option key={channel}>{channel}</option>
            ))}
          </Select>
          <small>{errors.preferredChannel?.message}</small>
        </Field>
        <Feedback error={action.error} />
        <Button $variant="primary" disabled={action.isPending}>
          Salvar canais
        </Button>
      </Form>
    </Modal>
  );
}
