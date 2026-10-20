import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useWorkspace } from '../../app/providers/Context';
import { useAction, useDatabase } from '../../hooks/useDatabase';
import { PortfolioService, portfolioSchema } from '../../services/operations';
import type { Portfolio } from '../../types/domain';
import { Modal } from '../../components/Modal';
import { Feedback } from '../../components/Feedback';
import { Button, Field, Form, Input, Row, Select } from '../../components/ui';
export function PortfolioForm({
  portfolio,
  onClose,
}: {
  portfolio: Portfolio | null;
  onClose: () => void;
}) {
  const { data: db } = useDatabase();
  const { scope, creditorId } = useWorkspace();
  const action = useAction();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(portfolioSchema),
    defaultValues: {
      name: portfolio?.name || '',
      creditorId: portfolio?.creditorId || creditorId || '',
      active: portfolio?.active ?? true,
    },
  });
  return (
    <Modal title={portfolio ? 'Editar carteira' : 'Nova carteira'} onClose={onClose}>
      <Form
        onSubmit={handleSubmit((v) =>
          action.mutate(() => PortfolioService.save(scope, v, portfolio?.id), {
            onSuccess: onClose,
          }),
        )}
      >
        <Field>
          Nome da carteira
          <Input {...register('name')} autoFocus placeholder="Nome da carteira" />
          <small>{errors.name?.message}</small>
        </Field>
        <Field>
          Empresa contratante
          <Select
            aria-label="Empresa contratante"
            {...register('creditorId')}
            disabled={!!portfolio || !!creditorId}
          >
            <option value="">Selecione a empresa contratante</option>
            {db?.creditors.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <small>{errors.creditorId?.message}</small>
        </Field>
        <Row>
          <input id="portfolio-active" type="checkbox" {...register('active')} />
          <label htmlFor="portfolio-active">Carteira ativa para negociação</label>
        </Row>
        <Feedback error={action.error} />
        <Button $variant="primary" disabled={action.isPending}>
          Salvar carteira
        </Button>
      </Form>
    </Modal>
  );
}
