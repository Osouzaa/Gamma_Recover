import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useWorkspace } from '../../../../app/providers/Context';
import { useAction, useDatabase } from '../../../../hooks/useDatabase';
import { PaymentService } from '../../../../services/operations';
import { metrics } from '../../../../services/domain';
import { date, money, today } from '../../../../utils/format';
import { DataTable } from '../../../../components/DataTable';
import { Modal } from '../../../../components/Modal';
import { Feedback, ErrorState, LoadingState } from '../../../../components/Feedback';
import {
  Alert,
  Button,
  Field,
  FilterBar,
  Form,
  Input,
  Metric,
  Metrics,
  Muted,
  PageHeader,
  Panel,
  PanelHeader,
  Select,
  Stack,
  Status,
} from '../../../../components/ui';
export default function Financial() {
  const { scope } = useWorkspace();
  const { data: db, isLoading, refetch } = useDatabase();
  const [params] = useSearchParams();
  const [filter, setFilter] = useState(params.get('situacao') || '');
  const [selected, setSelected] = useState('');
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [message, setMessage] = useState('');
  const action = useAction();
  if (isLoading) return <LoadingState />;
  if (!db) return <ErrorState retry={refetch} />;
  const m = metrics(db, scope.creditorId);
  const status = (i: (typeof db.installments)[number]) =>
    i.paidAt ? 'Pago' : i.divergence ? 'Divergência' : i.dueDate < today() ? 'Vencida' : 'A vencer';
  const rows = m.installments.filter(
    (i) =>
      !m.agreements.find((a) => a.id === i.agreementId)?.broken &&
      (!filter || status(i) === filter),
  );
  const installment = rows.find((i) => i.id === selected);
  return (
    <>
      <PageHeader
        title="Financeiro"
        description="Recebimentos diretamente ao credor e conciliação exclusivamente demonstrativa."
      />
      <Stack>
        <Metrics>
          <Metric>
            <p>Valor negociado</p>
            <strong>{money(m.negotiated)}</strong>
            <Muted>Acordos não cancelados</Muted>
          </Metric>
          <Metric>
            <p>Valor recebido</p>
            <strong>{money(m.received)}</strong>
            <Muted>Confirmações financeiras explícitas</Muted>
          </Metric>
          <Metric>
            <p>Parcelas vencidas</p>
            <strong>{money(m.overdue)}</strong>
            <Muted>Saldo não recebido</Muted>
          </Metric>
          <Metric>
            <p>Parcelas a vencer</p>
            <strong>
              {money(
                m.installments
                  .filter(
                    (i) =>
                      !i.paidAt &&
                      i.dueDate >= today() &&
                      !m.agreements.find((a) => a.id === i.agreementId)?.broken,
                  )
                  .reduce((s, i) => s + i.amount, 0),
              )}
            </strong>
            <Muted>Acordos em acompanhamento</Muted>
          </Metric>
        </Metrics>
        <Panel>
          <FilterBar>
            <Select
              aria-label="Situação financeira"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="">Todas as parcelas</option>
              {['A vencer', 'Vencida', 'Pago', 'Divergência'].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
            <Muted>Acordos cancelados e rompidos não entram na fila de conciliação.</Muted>
          </FilterBar>
          <DataTable
            rows={rows}
            rowKey={(i) => i.id}
            columns={[
              {
                key: 'agreement',
                label: 'Acordo / parcela',
                render: (i) => (
                  <>
                    {i.agreementId.slice(0, 14)}
                    <small>{i.number ? `Parcela ${i.number}` : 'Entrada'}</small>
                  </>
                ),
              },
              {
                key: 'due',
                label: 'Vencimento',
                render: (i) => date(i.dueDate),
                sortValue: (i) => i.dueDate,
              },
              {
                key: 'amount',
                label: 'Valor',
                render: (i) => money(i.amount),
                numeric: true,
                sortValue: (i) => i.amount,
              },
              {
                key: 'paid',
                label: 'Recebimento / referência',
                render: (i) =>
                  i.paidAt ? (
                    <>
                      {date(i.paidAt)}
                      <small>{i.paymentReference}</small>
                    </>
                  ) : (
                    '—'
                  ),
              },
              { key: 'status', label: 'Situação', render: (i) => <Status>{status(i)}</Status> },
              {
                key: 'actions',
                label: 'Conciliação',
                render: (i) => (
                  <Button
                    disabled={!!i.paidAt || scope.role === 'Operador'}
                    onClick={() => {
                      setSelected(i.id);
                      setAmount((i.amount / 100).toFixed(2));
                      setReference('');
                      setMessage('');
                      action.reset();
                    }}
                  >
                    Conciliar
                  </Button>
                ),
              },
            ]}
          />
        </Panel>
        <Panel>
          <PanelHeader>
            <h2>Recebimentos por credor · todo o histórico</h2>
          </PanelHeader>
          <DataTable
            rows={db.creditors.filter((c) => !scope.creditorId || c.id === scope.creditorId)}
            rowKey={(c) => c.id}
            columns={[
              { key: 'name', label: 'Credor', render: (c) => c.name },
              {
                key: 'received',
                label: 'Recebido',
                render: (c) => money(metrics(db, c.id).received),
                numeric: true,
              },
              {
                key: 'negotiated',
                label: 'Negociado',
                render: (c) => money(metrics(db, c.id).negotiated),
                numeric: true,
              },
            ]}
          />
        </Panel>
      </Stack>
      {installment && (
        <Modal title="Conciliação demonstrativa" onClose={() => setSelected('')}>
          <Form
            onSubmit={(e) => {
              e.preventDefault();
              action.mutate(
                () =>
                  PaymentService.reconcile(
                    scope,
                    installment.id,
                    Math.round(Number(amount) * 100),
                    reference,
                  ),
                { onSuccess: (r) => setMessage(String(r)) },
              );
            }}
          >
            <Alert>
              Registre uma confirmação fictícia de recebimento ao credor. Valores divergentes ficam
              pendentes; não quitam a parcela.
            </Alert>
            <p>
              Parcela esperada: <strong>{money(installment.amount)}</strong>
            </p>
            {installment.divergence && <Alert $error>{installment.divergence}</Alert>}
            <Field>
              Valor informado (R$)
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </Field>
            <Field>
              Referência da confirmação fictícia
              <Input
                value={reference}
                minLength={3}
                maxLength={100}
                onChange={(e) => setReference(e.target.value)}
                required
                placeholder="Ex.: DEMO-RECEB-001"
              />
            </Field>
            <Button $variant="primary" disabled={action.isPending || !!installment.paidAt}>
              Registrar conciliação
            </Button>
            <Feedback error={action.error} success={message || undefined} />
          </Form>
        </Modal>
      )}
    </>
  );
}
