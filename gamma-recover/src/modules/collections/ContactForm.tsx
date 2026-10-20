import { useEffect } from 'react';
import { useBlocker, useBeforeUnload } from 'react-router-dom';
import { contactChannels, contactDestination } from '../../services/contactChannels';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useWorkspace } from '../../app/providers/Context';
import { useAction, useDatabase } from '../../hooks/useDatabase';
import { CollectionService, contactSchema } from '../../services/operations';
import { Button, Field, Form, Input, Select, Textarea } from '../../components/ui';
import { Feedback } from '../../components/Feedback';
import { today, addDays } from '../../utils/format';
export function ContactForm({
  debtorId,
  debtId,
  disabled,
  onSaved,
  guardNavigation = false,
  onCancel,
}: {
  debtorId: string;
  debtId: string;
  disabled: boolean;
  onSaved: () => void;
  guardNavigation?: boolean;
  onCancel?: () => void;
}) {
  const { scope } = useWorkspace();
  const action = useAction();
  const { data: db } = useDatabase();
  const debtor = db?.debtors.find((d) => d.id === debtorId);
  const initialChannel =
    debtor?.preferredChannel && contactDestination(debtor, debtor.preferredChannel)
      ? debtor.preferredChannel
      : 'Registro interno';
  const defaultReturn = addDays(today(), db?.settings.returnDays || 3);
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      debtorId,
      debtId,
      channel: initialChannel,
      result: 'Contato realizado' as const,
      note: '',
      nextDate: defaultReturn,
      promiseAmount: 0,
    },
  });
  const result = watch('result');
  return (
    <Form
      onSubmit={handleSubmit((v) =>
        action.mutate(
          () =>
            CollectionService.record(scope, {
              ...v,
              debtorId,
              debtId,
              promiseAmount:
                v.result === 'Promessa de pagamento' ? Math.round(v.promiseAmount * 100) : 0,
              nextDate: ['Retorno agendado', 'Promessa de pagamento'].includes(v.result)
                ? v.nextDate
                : '',
            }),
          {
            onSuccess: () => {
              reset({
                debtorId,
                debtId,
                channel: initialChannel,
                result: 'Contato realizado',
                note: '',
                nextDate: defaultReturn,
                promiseAmount: 0,
              });
              onSaved();
            },
          },
        ),
      )}
    >
      {guardNavigation && <DraftGuard dirty={isDirty && !action.isSuccess} />}
      <Field>
        Canal do atendimento
        <Select
          aria-label="Canal do atendimento"
          {...register('channel')}
          disabled={disabled || action.isPending}
        >
          <option>Registro interno</option>
          {contactChannels.map((channel) => (
            <option key={channel} disabled={!debtor || !contactDestination(debtor, channel)}>
              {channel}
            </option>
          ))}
        </Select>
        <small>{errors.channel?.message}</small>
      </Field>
      <Field>
        Resultado do contato
        <Select
          aria-label="Resultado do contato"
          autoFocus
          {...register('result')}
          disabled={disabled || action.isPending}
        >
          <option>Contato realizado</option>
          <option>Sem contato</option>
          <option>Retorno agendado</option>
          <option>Promessa de pagamento</option>
          <option>Encerrado</option>
        </Select>
      </Field>
      <Field>
        Observações do atendimento
        <Textarea
          {...register('note')}
          placeholder="Registre informações objetivas do contato."
          disabled={disabled || action.isPending}
        />
        <small>{errors.note?.message}</small>
      </Field>
      {['Retorno agendado', 'Promessa de pagamento'].includes(result) && (
        <Field>
          Data do retorno ou promessa
          <Input
            type="date"
            min={today()}
            disabled={disabled || action.isPending}
            {...register('nextDate')}
          />
          <small>{errors.nextDate?.message}</small>
        </Field>
      )}
      {result === 'Promessa de pagamento' && (
        <Field>
          Valor prometido (R$)
          <Input
            type="number"
            disabled={disabled || action.isPending}
            min="0.01"
            step="0.01"
            {...register('promiseAmount', { valueAsNumber: true })}
          />
          <small>{errors.promiseAmount?.message}</small>
        </Field>
      )}
      <Feedback
        error={action.error}
        success={action.isSuccess ? 'Atendimento registrado.' : undefined}
      />
      <Button $variant="primary" disabled={disabled || action.isPending}>
        Salvar atendimento
      </Button>
      {onCancel && (
        <Button
          type="button"
          disabled={action.isPending}
          onClick={() => {
            if (!isDirty || window.confirm('Descartar o atendimento ainda não salvo?')) onCancel();
          }}
        >
          Cancelar
        </Button>
      )}
    </Form>
  );
}

function DraftGuard({ dirty }: { dirty: boolean }) {
  const { guardCreditorChange } = useWorkspace();
  useEffect(
    () =>
      guardCreditorChange(
        () =>
          !dirty || window.confirm('Descartar o atendimento ainda não salvo e trocar a empresa?'),
      ),
    [dirty, guardCreditorChange],
  );
  const blocker = useBlocker(dirty);
  useEffect(() => {
    if (blocker.state !== 'blocked') return;
    if (window.confirm('Descartar o atendimento ainda não salvo e sair desta ficha?'))
      blocker.proceed();
    else blocker.reset();
  }, [blocker]);
  useBeforeUnload((event) => {
    if (dirty) {
      event.preventDefault();
      event.returnValue = '';
    }
  });
  return null;
}
