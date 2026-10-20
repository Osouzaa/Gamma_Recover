import { ContactChannels } from '../../components/ContactChannels';
import type { Database, Debt } from '../../types/domain';
import { creditorOf } from '../../services/domain';
import { money } from '../../utils/format';
import { Modal } from '../../components/Modal';
import { Alert, Button, DetailList, Stack } from '../../components/ui';
import { ContactForm } from './ContactForm';
export function ContactDialog({
  db,
  debt,
  disabled,
  onClose,
  onSaved,
}: {
  db: Database;
  debt: Debt;
  disabled: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const debtor = db.debtors.find((d) => d.id === debt.debtorId)!;
  const company = db.creditors.find((c) => c.id === creditorOf(db, debt))!;
  return (
    <Modal title="Registrar atendimento" onClose={onClose}>
      <Stack>
        <DetailList>
          <dt>Devedor</dt>
          <dd>{debtor.name}</dd>
          <dt>Empresa</dt>
          <dd>{company.name}</dd>
          <dt>Contrato</dt>
          <dd>{debt.reference}</dd>
          <dt>Saldo original</dt>
          <dd>{money(debt.amount)}</dd>
        </DetailList>
        {disabled && (
          <Alert $error role="alert">
            Atendimento bloqueado. Verifique as restrições ou seu perfil.
          </Alert>
        )}
        <ContactChannels debtor={debtor} debtId={debt.id} disabled={disabled} />
        <ContactForm debtorId={debtor.id} debtId={debt.id} disabled={disabled} onSaved={onSaved} />
        <Button type="button" onClick={onClose}>
          Cancelar
        </Button>
      </Stack>
    </Modal>
  );
}
