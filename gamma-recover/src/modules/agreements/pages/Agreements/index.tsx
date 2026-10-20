import { ScheduleProgress } from '../../../../components/ScheduleProgress';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download } from 'lucide-react';
import { useWorkspace } from '../../../../app/providers/Context';
import { useAction, useDatabase } from '../../../../hooks/useDatabase';
import { AgreementService, scopedDebts } from '../../../../services/operations';
import { agreementStatus } from '../../../../services/domain';
import { date, download, money, today } from '../../../../utils/format';
import { Modal } from '../../../../components/Modal';
import { DataTable } from '../../../../components/DataTable';
import { Feedback, ErrorState, LoadingState } from '../../../../components/Feedback';
import {
  Alert,
  Button,
  DetailList,
  FilterBar,
  Input,
  PageHeader,
  Panel,
  Select,
  Stack,
  Status,
} from '../../../../components/ui';
export default function Agreements() {
  const [params] = useSearchParams();
  const [detail, setDetail] = useState(params.get('acordo') || '');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [confirmCancel, setConfirmCancel] = useState(false);
  const { scope } = useWorkspace();
  const { data: db, isLoading, refetch } = useDatabase();
  const action = useAction();
  if (isLoading) return <LoadingState />;
  if (!db) return <ErrorState retry={refetch} />;
  const debts = scopedDebts(db, scope);
  const rows = db.agreements.filter(
    (a) =>
      debts.some((d) => d.id === a.debtId) &&
      (!status || agreementStatus(db, a) === status) &&
      `${a.id} ${db.debtors.find((v) => v.id === debts.find((d) => d.id === a.debtId)?.debtorId)?.name}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const selected = db.agreements.find(
    (a) => a.id === detail && debts.some((d) => d.id === a.debtId),
  );
  const proposal = db.proposals.find((p) => p.id === selected?.proposalId);
  const installments = db.installments.filter((i) => i.agreementId === selected?.id);
  const canCancel =
    selected &&
    !selected.cancelled &&
    !selected.broken &&
    !installments.some((i) => i.paidAt) &&
    scope.role === 'Administrador';
  return (
    <>
      <PageHeader
        title="Acordos"
        description="Condições aceitas, parcelas e acompanhamento da inadimplência."
      />
      <Panel>
        <FilterBar>
          <Input
            aria-label="Buscar acordo"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar acordo ou devedor…"
          />
          <Select
            aria-label="Situação do acordo"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Todas as situações</option>
            {['Pendente', 'Ativo', 'Em atraso', 'Cumprido', 'Rompido', 'Cancelado'].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </Select>
        </FilterBar>
        <DataTable
          rows={rows}
          rowKey={(a) => a.id}
          columns={[
            { key: 'id', label: 'Acordo', render: (a) => a.id.slice(0, 16) },
            {
              key: 'debtor',
              label: 'Devedor',
              render: (a) =>
                db.debtors.find((v) => v.id === debts.find((d) => d.id === a.debtId)?.debtorId)
                  ?.name,
            },
            {
              key: 'created',
              label: 'Formalizado em',
              render: (a) => date(a.createdAt),
              sortValue: (a) => a.createdAt,
            },
            {
              key: 'total',
              label: 'Valor negociado',
              render: (a) => money(a.total),
              sortValue: (a) => a.total,
              numeric: true,
            },
            {
              key: 'status',
              label: 'Situação',
              render: (a) => <Status>{agreementStatus(db, a)}</Status>,
            },
            {
              key: 'actions',
              label: 'Ações',
              render: (a) => (
                <Button
                  onClick={() => {
                    setDetail(a.id);
                    setConfirmCancel(false);
                    action.reset();
                  }}
                >
                  Consultar acordo
                </Button>
              ),
            },
          ]}
        />
      </Panel>
      {selected && (
        <Modal title={`Acordo ${selected.id.slice(0, 16)}`} onClose={() => setDetail('')}>
          <Stack>
            <Status>{agreementStatus(db, selected)}</Status>
            <DetailList>
              <dt>Total negociado</dt>
              <dd>{money(selected.total)}</dd>
              <dt>Desconto</dt>
              <dd>{proposal?.discount}%</dd>
              <dt>Aceite</dt>
              <dd>
                {selected.acceptedBy} · {date(selected.createdAt)}
              </dd>
              <dt>Entrada</dt>
              <dd>{money(proposal?.entry || 0)}</dd>
            </DetailList>
            <ScheduleProgress installments={installments} />
            <DataTable
              rows={installments}
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
                      {selected.cancelled
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
            <Button
              onClick={() =>
                download(
                  `acordo-${selected.id}.txt`,
                  `COMPROVANTE DEMONSTRATIVO — SEM VALIDADE FINANCEIRA\nAcordo: ${selected.id}\nTotal: ${money(selected.total)}\nAceite: ${selected.acceptedBy}\n${installments.map((i) => `${i.number || 'Entrada'} | ${date(i.dueDate)} | ${money(i.amount)} | ${i.paidAt ? 'Pago' : 'Não pago'}`).join('\n')}\nPagamentos diretamente ao credor. Nenhum pagamento real é processado.`,
                  'text/plain;charset=utf-8',
                )
              }
            >
              <Download />
              Comprovante demonstrativo
            </Button>
            {canCancel && !confirmCancel && (
              <Button $variant="danger" onClick={() => setConfirmCancel(true)}>
                Cancelar acordo
              </Button>
            )}
            {canCancel && confirmCancel && (
              <>
                <Alert $error>
                  Confirmar cancelamento? O contrato voltará a ficar elegível para negociação. O
                  histórico será preservado.
                </Alert>
                <Button
                  $variant="danger"
                  disabled={action.isPending}
                  onClick={() =>
                    action.mutate(() => AgreementService.cancel(scope, selected.id), {
                      onSuccess: () => setConfirmCancel(false),
                    })
                  }
                >
                  Confirmar cancelamento
                </Button>
              </>
            )}
            <Feedback
              error={action.error}
              success={action.isSuccess ? 'Acordo cancelado.' : undefined}
            />
          </Stack>
        </Modal>
      )}
    </>
  );
}
