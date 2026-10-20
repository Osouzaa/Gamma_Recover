import { useState } from 'react';
import { ContactChannels } from '../../../../components/ContactChannels';
import { DebtorContactForm } from '../../DebtorContactForm';
import { ContactTimeline } from '../../../../components/ContactTimeline';
import { Link, useParams } from 'react-router-dom';
import { useWorkspace } from '../../../../app/providers/Context';
import { useAction, useDatabase } from '../../../../hooks/useDatabase';
import { DebtorService, scopedDebts } from '../../../../services/operations';
import { agreementStatus } from '../../../../services/domain';
import { date, money } from '../../../../utils/format';
import { DataTable } from '../../../../components/DataTable';
import { Feedback, ErrorState, LoadingState } from '../../../../components/Feedback';
import {
  Button,
  DetailList,
  Empty,
  PageHeader,
  Panel,
  PanelBody,
  PanelHeader,
  Split,
  Stack,
  Status,
} from '../../../../components/ui';
export default function DebtorDetail() {
  const { debtorId } = useParams();
  const [editingContacts, setEditingContacts] = useState(false);
  const { scope } = useWorkspace();
  const { data: db, isLoading, refetch } = useDatabase();
  const action = useAction();
  if (isLoading) return <LoadingState />;
  if (!db) return <ErrorState retry={refetch} />;
  const debts = scopedDebts(db, scope).filter((d) => d.debtorId === debtorId);
  const debtor = db.debtors.find((d) => d.id === debtorId);
  if (!debtor || !debts.length)
    return (
      <Empty>
        <h1>Cadastro indisponível</h1>
        <Link to="/devedores">Voltar à listagem</Link>
      </Empty>
    );
  const agreements = db.agreements.filter((a) => debts.some((d) => d.id === a.debtId));
  const proposals = db.proposals.filter((p) => debts.some((d) => d.id === p.debtId));
  const contacts = db.contacts.filter(
    (c) => c.debtorId === debtor.id && (!scope.creditorId || c.creditorId === scope.creditorId),
  );
  return (
    <>
      <PageHeader
        title={debtor.name}
        description={`${debtor.document} · Cadastro inteiramente fictício`}
        actions={
          <>
            <Button
              disabled={scope.role === 'Financeiro'}
              onClick={() => action.mutate(() => DebtorService.block(scope, debts[0].id))}
            >
              {debtor.blocked ? 'Liberar operação' : 'Bloquear operação'}
            </Button>
            <Link to={`/cobranca?devedor=${debtor.id}`}>Registrar atendimento →</Link>
          </>
        }
      />
      <Stack>
        <Feedback error={action.error} />
        <Split>
          <Panel>
            <PanelHeader>
              <h2>Canais do contribuinte</h2>
              <Button
                disabled={scope.role === 'Financeiro'}
                onClick={() => setEditingContacts(true)}
              >
                Editar canais
              </Button>
              <Status>{debtor.blocked ? 'Bloqueado' : 'Liberado'}</Status>
            </PanelHeader>
            <PanelBody>
              <DetailList>
                <dt>Documento</dt>
                <dd>{debtor.document}</dd>
                <dt>Bloqueio</dt>
                <dd>
                  {debtor.blocked
                    ? 'Contatos e negociações suspensos'
                    : 'Sem restrição operacional'}
                </dd>
              </DetailList>
              <ContactChannels
                debtor={debtor}
                debtId={debts.find((d) => !d.disputed)?.id || debts[0].id}
                disabled={scope.role === 'Financeiro' || debts.every((d) => d.disputed)}
              />
            </PanelBody>
          </Panel>
          <Panel>
            <PanelHeader>
              <h2>Histórico de contatos e observações</h2>
            </PanelHeader>
            <PanelBody>
              <ContactTimeline contacts={contacts} />
            </PanelBody>
          </Panel>
        </Split>
        <Panel>
          <PanelHeader>
            <h2>Dívidas vinculadas</h2>
          </PanelHeader>
          <DataTable
            rows={debts}
            rowKey={(d) => d.id}
            columns={[
              { key: 'reference', label: 'Contrato', render: (d) => d.reference },
              {
                key: 'portfolio',
                label: 'Carteira',
                render: (d) => db.portfolios.find((p) => p.id === d.portfolioId)?.name,
              },
              { key: 'due', label: 'Vencimento', render: (d) => date(d.dueDate) },
              {
                key: 'amount',
                label: 'Valor original',
                render: (d) => money(d.amount),
                numeric: true,
              },
              {
                key: 'status',
                label: 'Situação',
                render: (d) => (
                  <Status>
                    {d.disputed
                      ? 'Contestada'
                      : agreements.some((a) => a.debtId === d.id && !a.cancelled)
                        ? 'Com acordo'
                        : 'Disponível'}
                  </Status>
                ),
              },
              {
                key: 'actions',
                label: 'Ações',
                render: (d) => <Link to={`/negociacoes?divida=${d.id}`}>Negociar →</Link>,
              },
            ]}
          />
        </Panel>
        <Split>
          <Panel>
            <PanelHeader>
              <h2>Acordos</h2>
            </PanelHeader>
            <DataTable
              rows={agreements}
              rowKey={(a) => a.id}
              columns={[
                { key: 'total', label: 'Negociado', render: (a) => money(a.total) },
                {
                  key: 'status',
                  label: 'Situação',
                  render: (a) => <Status>{agreementStatus(db, a)}</Status>,
                },
                {
                  key: 'link',
                  label: 'Detalhes',
                  render: (a) => <Link to={`/acordos?acordo=${a.id}`}>Consultar →</Link>,
                },
              ]}
            />
          </Panel>
          <Panel>
            <PanelHeader>
              <h2>Histórico de propostas</h2>
            </PanelHeader>
            <DataTable
              rows={proposals}
              rowKey={(p) => p.id}
              columns={[
                { key: 'date', label: 'Data', render: (p) => date(p.createdAt) },
                { key: 'total', label: 'Proposta', render: (p) => money(p.total) },
                { key: 'discount', label: 'Desconto', render: (p) => `${p.discount}%` },
                { key: 'status', label: 'Situação', render: (p) => <Status>{p.status}</Status> },
              ]}
            />
          </Panel>
        </Split>
      </Stack>
      {editingContacts && (
        <DebtorContactForm
          debtor={debtor}
          debtId={debts[0].id}
          onClose={() => setEditingContacts(false)}
        />
      )}
    </>
  );
}
