import { useState } from 'react';
import type { Debt } from '../../types/domain';
import { useWorkspace } from '../../app/providers/Context';
import { useAction } from '../../hooks/useDatabase';
import { isSuspended } from '../../services/domain';
import { DebtSuspensionService } from '../../services/debtSuspension';
import { Modal } from '../../components/Modal';
import { Feedback } from '../../components/Feedback';
import { Alert, Button, Field, Form, Textarea } from '../../components/ui';
export function DebtSuspensionDialog({ debt, onClose }: { debt: Debt; onClose: () => void }) {
  const [reason, setReason] = useState('');
  const { scope } = useWorkspace();
  const action = useAction();
  const suspended = isSuspended(debt);
  const title = suspended ? 'Retomar cobrança' : 'Suspender cobrança';
  return (
    <Modal title={title} onClose={onClose}>
      <Form
        onSubmit={(e) => {
          e.preventDefault();
          action.mutate(() => DebtSuspensionService.set(scope, debt.id, !suspended, reason), {
            onSuccess: onClose,
          });
        }}
      >
        <p>Contrato {debt.reference}</p>
        <Alert>
          A alteração afeta somente contatos e novas negociações deste contrato. Acordos, parcelas e
          recebimentos são preservados. Outros bloqueios continuam válidos após a retomada.
        </Alert>
        <Field>
          Motivo da alteração
          <Textarea
            autoFocus
            required
            minLength={5}
            maxLength={2000}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </Field>
        <Feedback error={action.error} />
        <Button $variant="primary" disabled={action.isPending}>
          {title}
        </Button>
        <Button type="button" onClick={onClose}>
          Cancelar
        </Button>
      </Form>
    </Modal>
  );
}
