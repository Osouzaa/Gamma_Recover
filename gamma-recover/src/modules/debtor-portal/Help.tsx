import { useState } from 'react';
import { useAction, useDatabase } from '../../hooks/useDatabase';
import { creditorOf } from '../../services/domain';
import { requireDebt, transact } from '../../services/store';
import { portalSession } from '../../services/portalSession';
import { id } from '../../utils/format';
import { Feedback, LoadingState, ErrorState } from '../../components/Feedback';
import {
  Alert,
  Button,
  Field,
  Form,
  PageHeader,
  Panel,
  PanelBody,
  Select,
  Stack,
  Textarea,
} from '../../components/ui';
export default function PortalHelp() {
  const { data: db, isLoading, refetch } = useDatabase();
  const action = useAction();
  const [selected, setSelected] = useState('');
  const [reason, setReason] = useState('');
  if (isLoading) return <LoadingState />;
  if (!db) return <ErrorState retry={refetch} />;
  const debtorId = portalSession();
  const debts = db.debts.filter((d) => d.debtorId === debtorId);
  const debt = debts.find((d) => d.id === selected) || debts[0];
  return (
    <Stack>
      <PageHeader
        title="Ajuda e contestação"
        description="Registre uma contestação demonstrativa para suspender novas abordagens sobre o contrato."
      />
      <Alert>
        Como funciona? A negociação depende da política do credor. Nenhum boleto, Pix ou mensagem
        real é emitido nesta demonstração.
      </Alert>
      <Panel>
        <PanelBody>
          <Form
            onSubmit={(e) => {
              e.preventDefault();
              if (!debt) return;
              action.mutate(() =>
                transact(
                  'Contestação registrada',
                  debt.id,
                  { creditorId: creditorOf(db, debt), role: 'Operador', debtorId },
                  (current) => {
                    const target = requireDebt(
                      current,
                      { creditorId: '', role: 'Operador', debtorId: portalSession() },
                      debt.id,
                    );
                    if (!portalSession()) throw new Error('Sessão expirada. Acesse novamente.');
                    if (reason.trim().length < 10 || reason.length > 1000)
                      throw new Error('Descreva o motivo com 10 a 1.000 caracteres.');
                    if (target.disputed) throw new Error('Este contrato já foi contestado.');
                    target.disputed = true;
                    current.disputes.push({
                      id: id('ds'),
                      debtId: debt.id,
                      reason: reason.trim(),
                      date: new Date().toISOString(),
                    });
                  },
                ),
              );
            }}
          >
            <Field>
              Contrato
              <Select
                value={debt?.id || ''}
                onChange={(e) => {
                  setSelected(e.target.value);
                  action.reset();
                }}
              >
                {debts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.reference}
                  </option>
                ))}
              </Select>
            </Field>
            <Field>
              Motivo da contestação
              <Textarea
                value={reason}
                minLength={10}
                maxLength={1000}
                onChange={(e) => setReason(e.target.value)}
                required
                placeholder="Use apenas informações fictícias."
              />
            </Field>
            <Feedback
              error={action.error}
              success={
                action.isSuccess
                  ? 'Contestação registrada. Novos contatos e negociações desta dívida foram suspensos.'
                  : undefined
              }
            />
            <Button $variant="primary" disabled={!debt || debt.disputed || action.isPending}>
              Registrar contestação demonstrativa
            </Button>
          </Form>
        </PanelBody>
      </Panel>
    </Stack>
  );
}
