import { useState } from 'react';
import { useWorkspace } from '../../app/providers/Context';
import { useAction } from '../../hooks/useDatabase';
import type { Database } from '../../types/domain';
import { scopedDebts } from '../../services/operations';
import { TaskService } from '../../services/tasks';
import { today } from '../../utils/format';
import { Modal } from '../../components/Modal';
import { Feedback } from '../../components/Feedback';
import { Button, Field, Form, Input, Select } from '../../components/ui';
export function TaskForm({ db, onClose }: { db: Database; onClose: () => void }) {
  const { scope } = useWorkspace();
  const action = useAction();
  const [debtId, setDebtId] = useState('');
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState(today());
  return (
    <Modal title="Nova tarefa" onClose={onClose}>
      <Form
        onSubmit={(e) => {
          e.preventDefault();
          action.mutate(() => TaskService.create(scope, { debtId, title, dueDate }), {
            onSuccess: onClose,
          });
        }}
      >
        <Field>
          Contrato
          <Select
            required
            aria-label="Contrato da tarefa"
            value={debtId}
            onChange={(e) => setDebtId(e.target.value)}
          >
            <option value="">Selecione um contrato</option>
            {scopedDebts(db, scope).map((d) => (
              <option value={d.id} key={d.id}>
                {d.reference} · {db.debtors.find((v) => v.id === d.debtorId)?.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field>
          Próxima ação
          <Input
            autoFocus
            required
            minLength={5}
            maxLength={200}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex.: revisar documentação do contrato"
          />
        </Field>
        <Field>
          Prazo
          <Input
            type="date"
            required
            min={today()}
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </Field>
        <p>
          Responsável: {db.settings.operatorName}. Concluir uma tarefa não confirma contato ou
          pagamento.
        </p>
        <Feedback error={action.error} />
        <Button $variant="primary" disabled={action.isPending}>
          Criar tarefa
        </Button>
        <Button type="button" onClick={onClose}>
          Cancelar
        </Button>
      </Form>
    </Modal>
  );
}
