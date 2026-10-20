import { isSuspended } from '../../services/domain';
import { useState } from 'react';
import type { Database } from '../../types/domain';
import { useWorkspace } from '../../app/providers/Context';
import { useAction } from '../../hooks/useDatabase';
import { scopedDebts } from '../../services/operations';
import { creditorOf } from '../../services/domain';
import {
  messageDestination,
  messageChannels,
  displayDestination,
} from '../../services/messageChannels';
import type { MessageChannel } from '../../types/conversations';
import { ConversationService } from '../../services/conversations';
import { Modal } from '../../components/Modal';
import { Feedback } from '../../components/Feedback';
import { Alert, Button, Field, Form, Select } from '../../components/ui';
export function NewConversation({
  db,
  initialDebtId,
  onClose,
  onOpen,
}: {
  db: Database;
  initialDebtId: string;
  onClose: () => void;
  onOpen: (id: string) => void;
}) {
  const { scope } = useWorkspace();
  const action = useAction();
  const [channel, setChannel] = useState<MessageChannel>('WhatsApp');
  const [debtId, setDebtId] = useState(initialDebtId);
  const debts = scopedDebts(db, scope);
  const debt = debts.find((d) => d.id === debtId);
  const debtor = db.debtors.find((d) => d.id === debt?.debtorId);
  const destination = debtor ? messageDestination(debtor, channel) : '';
  const blocked =
    !debt ||
    !destination ||
    debtor?.blocked ||
    debt.disputed ||
    isSuspended(debt) ||
    scope.role === 'Financeiro';
  return (
    <Modal title="Preparar conversa" onClose={onClose}>
      <Form
        onSubmit={(e) => {
          e.preventDefault();
          action.mutate(() => ConversationService.open(scope, debtId, channel), {
            onSuccess: (id) => onOpen(String(id)),
          });
        }}
      >
        <Alert>
          Conversa demonstrativa. Nenhum canal está conectado; nenhuma mensagem será enviada.
        </Alert>
        <Field>
          Canal de contato
          <Select
            aria-label="Canal de contato"
            value={channel}
            onChange={(e) => setChannel(e.target.value as MessageChannel)}
          >
            {messageChannels.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </Select>
        </Field>
        <Field>
          Contrato do contribuinte
          <Select
            aria-label="Contrato do contribuinte"
            value={debtId}
            onChange={(e) => setDebtId(e.target.value)}
            autoFocus
          >
            <option value="">Selecione um contrato</option>
            {debts.map((d) => (
              <option key={d.id} value={d.id}>
                {db.debtors.find((v) => v.id === d.debtorId)?.name} · {d.reference} ·{' '}
                {db.creditors.find((c) => c.id === creditorOf(db, d))?.name}
              </option>
            ))}
          </Select>
        </Field>
        {debtor && (
          <p>
            {debtor.name} · {channel}:{' '}
            {destination ? displayDestination(channel, destination) : 'não cadastrado ou inválido'}
          </p>
        )}
        {blocked && debt && (
          <Alert $error>
            Verifique o destino cadastrado, bloqueios, contestação e permissões antes de preparar a
            conversa.
          </Alert>
        )}
        <Feedback error={action.error} />
        <Button $variant="primary" disabled={!!blocked || action.isPending}>
          Preparar conversa
        </Button>
      </Form>
    </Modal>
  );
}
