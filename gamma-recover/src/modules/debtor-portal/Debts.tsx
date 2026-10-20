import { Link, useParams, useNavigate } from 'react-router-dom';
import { useDatabase } from '../../hooks/useDatabase';
import { portalSession } from '../../services/portalSession';
import { activeAgreement, creditorOf } from '../../services/domain';
import { money, date } from '../../utils/format';
import { Simulator } from '../negotiations/Simulator';
import { DataTable } from '../../components/DataTable';
import { ErrorState, LoadingState } from '../../components/Feedback';
import {
  Alert,
  DetailList,
  Empty,
  PageHeader,
  Panel,
  PanelBody,
  PanelHeader,
  Stack,
  Status,
} from '../../components/ui';
export default function PortalDebts() {
  const { debtId, step } = useParams();
  const navigate = useNavigate();
  const { data: db, isLoading, refetch } = useDatabase();
  const debtorId = portalSession();
  if (isLoading) return <LoadingState />;
  if (!db) return <ErrorState retry={refetch} />;
  const debts = db.debts.filter((d) => d.debtorId === debtorId);
  const debt = debts.find((d) => d.id === debtId);
  if (debtId && !debt)
    return (
      <Empty>
        Contrato indisponível nesta sessão. <Link to="/portal/dividas">Voltar</Link>
      </Empty>
    );
  if (debt) {
    const creditor = db.creditors.find((c) => c.id === creditorOf(db, debt))!;
    const agreement = activeAgreement(db, debt.id);
    const eligible =
      !agreement &&
      !debt.disputed &&
      !db.debtors.find((d) => d.id === debtorId)?.blocked &&
      db.portfolios.find((p) => p.id === debt.portfolioId)?.active;
    return (
      <Stack>
        <PageHeader
          title={
            step === 'simular'
              ? 'Simular acordo'
              : step === 'propostas'
                ? 'Propostas disponíveis'
                : 'Detalhes da dívida'
          }
          description={debt.reference}
        />
        {step === 'simular' && eligible ? (
          <Simulator
            key={debt.id}
            initialProposal={db.proposals
              .filter((p) => p.debtId === debt.id && p.status !== 'Aceita')
              .at(-1)}
            db={db}
            debtId={debt.id}
            scope={{ creditorId: creditor.id, role: 'Operador', debtorId }}
            onConfirmed={(id) => navigate(`/portal/confirmacao/${id}`)}
          />
        ) : (
          <Panel>
            <PanelHeader>
              <h2>{creditor.name}</h2>
              <Status>
                {debt.disputed ? 'Contestada' : agreement ? 'Com acordo' : 'Disponível'}
              </Status>
            </PanelHeader>
            <PanelBody>
              <Stack>
                <DetailList>
                  <dt>Contrato</dt>
                  <dd>{debt.reference}</dd>
                  <dt>Valor original</dt>
                  <dd>{money(debt.amount)}</dd>
                  <dt>Vencimento</dt>
                  <dd>{date(debt.dueDate)}</dd>
                  <dt>Desconto máximo</dt>
                  <dd>{creditor.policy.maxDiscount}%</dd>
                  <dt>Parcelamento</dt>
                  <dd>
                    Até {creditor.policy.maxInstallments} parcelas, mínimo{' '}
                    {money(creditor.policy.minInstallment)}
                  </dd>
                </DetailList>
                {eligible ? (
                  <Link
                    to={`/portal/dividas/${debt.id}/${step === 'propostas' ? 'simular' : 'propostas'}`}
                  >
                    {step === 'propostas'
                      ? 'Personalizar proposta e simular'
                      : 'Ver propostas disponíveis'}{' '}
                    ?
                  </Link>
                ) : (
                  <Alert>
                    {agreement
                      ? 'Este contrato já possui acordo. Consulte Meus acordos.'
                      : 'Negociação indisponível por bloqueio, contestação ou carteira inativa.'}
                  </Alert>
                )}
                <Link to="/portal/ajuda">Preciso de ajuda ou quero contestar</Link>
              </Stack>
            </PanelBody>
          </Panel>
        )}
        <Link to="/portal/dividas">← Minhas dívidas</Link>
      </Stack>
    );
  }
  return (
    <>
      <PageHeader
        title="Minhas dívidas"
        description={`Ol?, ${db.debtors.find((d) => d.id === debtorId)?.name}. Estes são seus contratos fictícios.`}
      />
      <Panel>
        <DataTable
          rows={debts}
          rowKey={(d) => d.id}
          columns={[
            {
              key: 'creditor',
              label: 'Credor / contrato',
              render: (d) => (
                <>
                  {db.creditors.find((c) => c.id === creditorOf(db, d))?.name}
                  <small>{d.reference}</small>
                </>
              ),
            },
            { key: 'amount', label: 'Valor original', render: (d) => money(d.amount) },
            {
              key: 'status',
              label: 'Situação',
              render: (d) => (
                <Status>
                  {d.disputed
                    ? 'Contestada'
                    : activeAgreement(db, d.id)
                      ? 'Com acordo'
                      : 'Disponível'}
                </Status>
              ),
            },
            {
              key: 'actions',
              label: 'Consultar',
              render: (d) => <Link to={`/portal/dividas/${d.id}`}>Ver dívida →</Link>,
            },
          ]}
        />
      </Panel>
    </>
  );
}
