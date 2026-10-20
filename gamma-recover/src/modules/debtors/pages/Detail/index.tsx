import { ContactLayout, HistoryLayout, ActionGroup, ProfileDetails } from './styles';
import { DebtorLocationForm } from '../../DebtorLocationForm';
import { locationLabel } from '../../../../services/location';
import type { Debt } from '../../../../types/domain';
import { DebtSuspensionDialog } from '../../DebtSuspensionDialog';
import { useState } from 'react';
import { ContactChannels } from '../../../../components/ContactChannels';
import { DebtorContactForm } from '../../DebtorContactForm';
import { ContactTimeline } from '../../../../components/ContactTimeline';
import { Link, useParams } from 'react-router-dom';
import { useWorkspace } from '../../../../app/providers/Context';
import { useAction, useDatabase } from '../../../../hooks/useDatabase';
import { DebtorService, scopedDebts } from '../../../../services/operations';
import { agreementStatus, isSuspended } from '../../../../services/domain';
import { date, money } from '../../../../utils/format';
import { DataTable } from '../../../../components/DataTable';
import { Feedback, ErrorState, LoadingState } from '../../../../components/Feedback';
import {
  Button,
  Empty,
  PageHeader,
  Panel,
  PanelBody,
  PanelHeader,
  Stack,
  Status,
} from '../../../../components/ui';
export default function DebtorDetail() {
  const { debtorId } = useParams();
  const [suspensionDebt, setSuspensionDebt] = useState<Debt>();
  const [editingLocation, setEditingLocation] = useState(false);
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
            <Button as={Link} $variant="primary" to={`/cobranca?devedor=${debtor.id}`}>
              Registrar atendimento
            </Button>
          </>
        }
      />
      <Stack>
        <Feedback error={action.error} />
        <ContactLayout>
          <Panel>
            <PanelHeader>
              <h2>Cadastro e contato</h2>
              <Status>{debtor.blocked ? 'Bloqueado' : 'Liberado'}</Status>
            </PanelHeader>
            <PanelBody>
              <ProfileDetails>
                <dt>Documento</dt>
                <dd>{debtor.document}</dd>
                <dt>Cidade / UF</dt>
                <dd>{locationLabel(debtor.location)}</dd>
                <dt>Bloqueio</dt>
                <dd>
                  {debtor.blocked
                    ? 'Contatos e negociações suspensos'
                    : 'Sem restrição operacional'}
                </dd>
              </ProfileDetails>
              <ActionGroup>
                <Button
                  disabled={scope.role === 'Financeiro'}
                  onClick={() => setEditingLocation(true)}
                >
                  Editar localização
                </Button>
                <Button
                  disabled={scope.role === 'Financeiro'}
                  onClick={() => setEditingContacts(true)}
                >
                  Editar canais
                </Button>
              </ActionGroup>
              <h3>Canais do contribuinte</h3>
              <ContactChannels
                debtor={debtor}
                debtId={debts.find((d) => !d.disputed && !isSuspended(d))?.id || debts[0].id}
                disabled={
                  scope.role === 'Financeiro' || debts.every((d) => d.disputed || isSuspended(d))
                }
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
        </ContactLayout>
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
                    {isSuspended(d)
                      ? 'Cobrança suspensa'
                      : d.disputed
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
                render: (d) => (
                  <ActionGroup>
                    {!isSuspended(d) && (
                      <Button as={Link} to={`/negociacoes?divida=${d.id}`}>
                        Negociar
                      </Button>
                    )}
                    <Button
                      disabled={scope.role === 'Financeiro'}
                      onClick={() => setSuspensionDebt(d)}
                    >
                      {isSuspended(d) ? 'Retomar cobrança' : 'Suspender cobrança'}
                    </Button>
                  </ActionGroup>
                ),
              },
            ]}
          />
        </Panel>
        <Panel>
          <PanelHeader>
            <h2>Histórico de suspensão por contrato</h2>
          </PanelHeader>
          <DataTable
            rows={debts
              .flatMap((d) =>
                (d.suspensionHistory || []).map((event, index) => ({
                  ...event,
                  reference: d.reference,
                  key: `${d.id}-${index}`,
                })),
              )
              .sort((a, b) => b.date.localeCompare(a.date))}
            rowKey={(event) => event.key}
            columns={[
              { key: 'contract', label: 'Contrato', render: (event) => event.reference },
              {
                key: 'date',
                label: 'Data',
                render: (event) =>
                  new Date(event.date).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
              },
              {
                key: 'state',
                label: 'Ação',
                render: (event) => (event.suspended ? 'Suspensão' : 'Retomada'),
              },
              { key: 'reason', label: 'Motivo', render: (event) => event.reason },
              { key: 'actor', label: 'Responsável', render: (event) => event.actor },
            ]}
          />
        </Panel>
        <HistoryLayout>
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
        </HistoryLayout>
      </Stack>
      {suspensionDebt && (
        <DebtSuspensionDialog debt={suspensionDebt} onClose={() => setSuspensionDebt(undefined)} />
      )}
      {editingLocation && (
        <DebtorLocationForm
          debtor={debtor}
          debtId={debts[0].id}
          onClose={() => setEditingLocation(false)}
        />
      )}
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
