import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useWorkspace } from '../../../../app/providers/Context';
import { useAction, useDatabase } from '../../../../hooks/useDatabase';
import { NegotiationService, scopedDebts } from '../../../../services/operations';
import { activeAgreement, isSuspended } from '../../../../services/domain';
import { date, money } from '../../../../utils/format';
import { DataTable } from '../../../../components/DataTable';
import { Feedback, ErrorState, LoadingState } from '../../../../components/Feedback';
import {
  Alert,
  Button,
  Row,
  Field,
  PageHeader,
  Panel,
  PanelHeader,
  Select,
  Stack,
  Status,
} from '../../../../components/ui';
import { Simulator } from '../../Simulator';
export default function Negotiations() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const action = useAction();
  const [proposalId, setProposalId] = useState('');
  const [selected, setSelected] = useState(params.get('divida') || '');
  const { scope } = useWorkspace();
  const { data: db, isLoading, refetch } = useDatabase();
  if (isLoading) return <LoadingState />;
  if (!db) return <ErrorState retry={refetch} />;
  const debts = scopedDebts(db, scope);
  const eligible = debts.filter(
    (d) =>
      !activeAgreement(db, d.id) &&
      !d.disputed &&
      !isSuspended(d) &&
      !db.debtors.find((v) => v.id === d.debtorId)?.blocked &&
      db.portfolios.find((p) => p.id === d.portfolioId)?.active,
  );
  const debt = eligible.find((d) => d.id === selected) || eligible[0];
  const history = db.proposals.filter((p) => debts.some((d) => d.id === p.debtId)).reverse();
  return (
    <>
      <PageHeader
        title="Negociações"
        description="Simule condições dentro da política de cada credor e formalize o acordo."
      />
      <Stack>
        <Field>
          Selecione uma dívida elegível
          <Select
            aria-label="Dívida para negociação"
            value={debt?.id || ''}
            onChange={(e) => {
              setSelected(e.target.value);
              setProposalId('');
            }}
          >
            <option value="" disabled>
              Selecione um contrato
            </option>
            {eligible.map((d) => (
              <option key={d.id} value={d.id}>
                {db.debtors.find((v) => v.id === d.debtorId)?.name} · {d.reference} ·{' '}
                {money(d.amount)}
              </option>
            ))}
          </Select>
        </Field>
        {scope.role === 'Financeiro' ? (
          <Alert>
            Perfil financeiro: consulta de propostas. A formalização exige perfil Operador ou
            Administrador.
          </Alert>
        ) : debt ? (
          <Simulator
            key={debt.id + proposalId}
            initialProposal={db.proposals.find((p) => p.id === proposalId && p.debtId === debt.id)}
            db={db}
            debtId={debt.id}
            scope={scope}
            onConfirmed={(id) => navigate(`/acordos?acordo=${id}`)}
          />
        ) : (
          <Alert>
            Não há dívidas elegíveis neste contexto. Consulte os acordos ou altere o credor.
          </Alert>
        )}
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
                        disabled={
                          scope.role === 'Financeiro' || !eligible.some((d) => d.id === p.debtId)
                        }
                        onClick={() => {
                          setSelected(p.debtId);
                          setProposalId(p.id);
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
    </>
  );
}
