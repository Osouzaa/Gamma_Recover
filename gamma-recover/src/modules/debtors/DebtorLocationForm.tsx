import { useState } from 'react';
import type { Debtor } from '../../types/domain';
import { useWorkspace } from '../../app/providers/Context';
import { useAction } from '../../hooks/useDatabase';
import { states, type Location } from '../../services/location';
import { DebtorLocationService } from '../../services/debtorLocation';
import { Modal } from '../../components/Modal';
import { Feedback } from '../../components/Feedback';
import { Alert, Button, Field, Form, Input, Select } from '../../components/ui';
export function DebtorLocationForm({
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
  const [city, setCity] = useState(debtor.location?.city || '');
  const [state, setState] = useState(debtor.location?.state || '');
  return (
    <Modal title="Editar localização" onClose={onClose}>
      <Form
        onSubmit={(e) => {
          e.preventDefault();
          action.mutate(
            () =>
              DebtorLocationService.save(
                scope,
                debtId,
                city.trim() || state ? ({ city, state } as Location) : undefined,
              ),
            { onSuccess: onClose },
          );
        }}
      >
        <p>{debtor.name}</p>
        <Alert>
          Use somente dados fictícios. A localização pertence à pessoa e vale para seus contratos.
          Deixe cidade e UF vazias para remover.
        </Alert>
        <Field>
          Cidade
          <Input
            autoFocus
            value={city}
            maxLength={100}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Ex.: Campinas"
          />
        </Field>
        <Field>
          UF
          <Select aria-label="UF" value={state} onChange={(e) => setState(e.target.value)}>
            <option value="">Não informada</option>
            {states.map((uf) => (
              <option key={uf}>{uf}</option>
            ))}
          </Select>
        </Field>
        <Feedback error={action.error} />
        <Button $variant="primary" disabled={action.isPending}>
          Salvar localização
        </Button>
        <Button type="button" onClick={onClose}>
          Cancelar
        </Button>
      </Form>
    </Modal>
  );
}
