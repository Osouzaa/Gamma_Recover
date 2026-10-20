import { Link } from 'react-router-dom';
import type { Database, Proposal } from '../../types/domain';
import type { Scope } from '../../services/store';
import { useAction } from '../../hooks/useDatabase';
import { NegotiationService, scopedDebts } from '../../services/operations';
import { date, money } from '../../utils/format';
import { DataTable } from '../../components/DataTable';
import { Feedback } from '../../components/Feedback';
import { Button, Row, Panel, PanelHeader, Stack, Status } from '../../components/ui';

export function ProposalHistory({
  db,
  scope,
  eligibleIds,
  onResume,
}: {
  db: Database;
  scope: Scope;
  eligibleIds: string[];
  onResume: (proposal: Proposal) => void;
}) {
  const action = useAction();
  const debts = scopedDebts(db, scope);
  const history = db.proposals.filter((p) => debts.some((d) => d.id === p.debtId)).reverse();
  return (
    <Stack>
      <Feedback
        error={action.error}
        success={
          action.isSuccess
            ? 'Proposta aprovada. Retome a negociação para confirmar o aceite.'
            : undefined
        }
      />
      <Panel>
        <PanelHeader>
          <h2>Histórico de propostas</h2>
          <Link to="/acordos">Consultar acordos →</Link>
        </PanelHeader>
        <DataTable
          rows={history}
          rowKey={(p) => p.id}
          columns={[
            {
              key: 'date',
              label: 'Criada em',
              render: (p) => date(p.createdAt),
              sortValue: (p) => p.createdAt,
            },
            {
              key: 'reference',
              label: 'Contrato',
              render: (p) => db.debts.find((d) => d.id === p.debtId)?.reference,
            },
            { key: 'discount', label: 'Desconto', render: (p) => `${p.discount}%` },
            {
              key: 'total',
              label: 'Total negociado',
              render: (p) => money(p.total),
              numeric: true,
            },
            { key: 'count', label: 'Parcelas', render: (p) => p.count, numeric: true },
            { key: 'status', label: 'Situação', render: (p) => <Status>{p.status}</Status> },
            {
              key: 'actions',
              label: 'Ações',
              render: (p) => (
                <Row>
                  {p.status === 'Aguardando aprovação' && (
                    <Button
                      disabled={scope.role !== 'Administrador' || action.isPending}
                      onClick={() => action.mutate(() => NegotiationService.approve(scope, p.id))}
                    >
                      Aprovar proposta
                    </Button>
                  )}
                  {p.status !== 'Aceita' && (
                    <Button
                      disabled={scope.role === 'Financeiro' || !eligibleIds.includes(p.debtId)}
                      onClick={() => {
                        onResume(p);
                      }}
                    >
                      Retomar proposta
                    </Button>
                  )}
                </Row>
              ),
            },
          ]}
        />
      </Panel>
    </Stack>
  );
}
