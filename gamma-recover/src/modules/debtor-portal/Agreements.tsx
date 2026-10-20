import { ScheduleProgress } from '../../components/ScheduleProgress';
import { Link, useParams } from 'react-router-dom';
import { useDatabase } from '../../hooks/useDatabase';
import { portalSession } from '../../services/portalSession';
import { agreementStatus } from '../../services/domain';
import { date, money, today } from '../../utils/format';
import { DataTable } from '../../components/DataTable';
import { ErrorState, LoadingState } from '../../components/Feedback';
import { Alert, Empty, PageHeader, Panel, PanelHeader, Stack, Status } from '../../components/ui';
export default function PortalAgreements({ confirmation = false }: { confirmation?: boolean }) {
  const { agreementId } = useParams();
  const { data: db, isLoading, refetch } = useDatabase();
  if (isLoading) return <LoadingState />;
  if (!db) return <ErrorState retry={refetch} />;
  const debts = db.debts.filter((d) => d.debtorId === portalSession());
  const agreements = db.agreements.filter((a) => debts.some((d) => d.id === a.debtId));
  const agreement = agreements.find((a) => a.id === agreementId);
  if (agreementId && !agreement) return <Empty>Acordo indisponível nesta sessão.</Empty>;
  return (
    <Stack>
      <PageHeader
        title={
          confirmation
            ? 'Acordo demonstrativo confirmado'
            : agreement
              ? 'Parcelas do acordo'
              : 'Meus acordos'
        }
        description="Acompanhe condições e recebimentos registrados pelo credor."
      />
      {confirmation && (
        <Alert>
          O aceite demonstrativo foi registrado. Nenhum pagamento foi realizado. Os pagamentos são
          destinados diretamente ao credor.
        </Alert>
      )}
      {agreement ? (
        <>
          <Panel>
            <PanelHeader>
              <h2>Total: {money(agreement.total)}</h2>
              <Status>{agreementStatus(db, agreement)}</Status>
            </PanelHeader>
            <ScheduleProgress
              installments={db.installments.filter((i) => i.agreementId === agreement.id)}
            />
            <DataTable
              rows={db.installments.filter((i) => i.agreementId === agreement.id)}
              rowKey={(i) => i.id}
              columns={[
                { key: 'number', label: 'Parcela', render: (i) => i.number || 'Entrada' },
                { key: 'due', label: 'Vencimento', render: (i) => date(i.dueDate) },
                { key: 'amount', label: 'Valor', render: (i) => money(i.amount) },
                {
                  key: 'status',
                  label: 'Situação',
                  render: (i) => (
                    <Status>
                      {agreement.cancelled
                        ? 'Cancelado'
                        : i.paidAt
                          ? 'Pago'
                          : i.dueDate < today()
                            ? 'Vencida'
                            : 'A vencer'}
                    </Status>
                  ),
                },
              ]}
            />
          </Panel>
          <Link to="/portal/acordos">Ver todos os acordos →</Link>
        </>
      ) : (
        <Panel>
          <DataTable
            rows={agreements}
            rowKey={(a) => a.id}
            columns={[
              {
                key: 'contract',
                label: 'Contrato',
                render: (a) => debts.find((d) => d.id === a.debtId)?.reference,
              },
              { key: 'total', label: 'Negociado', render: (a) => money(a.total) },
              {
                key: 'status',
                label: 'Situação',
                render: (a) => <Status>{agreementStatus(db, a)}</Status>,
              },
              {
                key: 'action',
                label: 'Acompanhar',
                render: (a) => <Link to={`/portal/acordos/${a.id}`}>Ver parcelas →</Link>,
              },
            ]}
          />
        </Panel>
      )}
    </Stack>
  );
}
