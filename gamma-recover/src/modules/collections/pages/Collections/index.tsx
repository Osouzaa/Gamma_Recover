import { ContactChannels } from '../../../../components/ContactChannels';
import { DebtorContactForm } from '../../../debtors/DebtorContactForm';
import { ContactTimeline } from '../../../../components/ContactTimeline';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useDatabase } from '../../../../hooks/useDatabase';
import { useWorkspace } from '../../../../app/providers/Context';
import { scopedDebts } from '../../../../services/operations';
import { activeAgreement, creditorOf } from '../../../../services/domain';
import { date, money } from '../../../../utils/format';
import { DataTable } from '../../../../components/DataTable';
import { Feedback, ErrorState, LoadingState } from '../../../../components/Feedback';
import {
  Alert,
  Button,
  DetailList,
  Empty,
  FilterBar,
  Input,
  PageHeader,
  Panel,
  PanelBody,
  PanelHeader,
  Split,
  Stack,
  Status,
} from '../../../../components/ui';
import { ContactDialog } from '../../ContactDialog';
export default function Collections() {
  const [params] = useSearchParams();
  const [debtId, setDebtId] = useState(params.get('divida') || '');
  const [contactId, setContactId] = useState('');
  const [editingChannels, setEditingChannels] = useState(false);
  const [saved, setSaved] = useState(false);
  const [search, setSearch] = useState('');
  const { data: db, isLoading, refetch } = useDatabase();
  const { scope } = useWorkspace();
  if (isLoading) return <LoadingState />;
  if (!db) return <ErrorState retry={refetch} />;
  const queue = scopedDebts(db, scope).filter(
    (d) =>
      !activeAgreement(db, d.id) &&
      db.debtors
        .find((v) => v.id === d.debtorId)
        ?.name.toLowerCase()
        .includes(search.toLowerCase()) &&
      !db.contacts.some(
        (c) => c.debtorId === d.debtorId && c.creditorId === creditorOf(db, d) && c.closed,
      ),
  );
  const selected =
    queue.find((d) => d.id === debtId) ||
    queue.find((d) => d.debtorId === params.get('devedor')) ||
    queue[0];
  const contactDebt = scopedDebts(db, scope).find((d) => d.id === contactId);
  const debtor = db.debtors.find((d) => d.id === selected?.debtorId);
  const blocked = !!(debtor?.blocked || selected?.disputed || scope.role === 'Financeiro');
  return (
    <>
      <PageHeader
        title="Operação de cobrança"
        description="Fila de trabalho e registro de atendimentos. Nenhuma comunicação é enviada."
      />
      <Stack>
        <Feedback success={saved ? 'Atendimento registrado. Histórico atualizado.' : undefined} />
        <Panel>
          <FilterBar>
            <Input
              aria-label="Buscar na fila"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Localizar devedor na fila…"
            />
            <span>{queue.length} contratos na fila</span>
          </FilterBar>
          <DataTable
            rows={queue}
            selectedRowKey={selected?.id}
            rowKey={(d) => d.id}
            pageSize={5}
            columns={[
              {
                key: 'name',
                label: 'Devedor',
                render: (d) => db.debtors.find((v) => v.id === d.debtorId)?.name,
                sortValue: (d) => db.debtors.find((v) => v.id === d.debtorId)?.name || '',
              },
              {
                key: 'company',
                label: 'Empresa',
                render: (d) => db.creditors.find((c) => c.id === creditorOf(db, d))?.name,
              },
              { key: 'reference', label: 'Contrato', render: (d) => d.reference },
              {
                key: 'amount',
                label: 'Saldo',
                render: (d) => money(d.amount),
                numeric: true,
                sortValue: (d) => d.amount,
              },
              {
                key: 'due',
                label: 'Vencimento original',
                render: (d) => date(d.dueDate),
                sortValue: (d) => d.dueDate,
              },
              {
                key: 'actions',
                label: 'Atendimento',
                render: (d) => (
                  <Button aria-pressed={selected?.id === d.id} onClick={() => setDebtId(d.id)}>
                    {selected?.id === d.id ? 'Selecionado' : 'Selecionar'}
                  </Button>
                ),
              },
            ]}
          />
        </Panel>
        {selected && debtor ? (
          <Split>
            <Panel>
              <PanelHeader>
                <h2>{debtor.name}</h2>
                <Button
                  $variant="primary"
                  disabled={blocked}
                  onClick={() => {
                    setSaved(false);
                    setContactId(selected.id);
                  }}
                >
                  Registrar atendimento
                </Button>
              </PanelHeader>
              <PanelBody>
                <Stack>
                  <DetailList>
                    <dt>Empresa</dt>
                    <dd>{db.creditors.find((c) => c.id === creditorOf(db, selected))?.name}</dd>
                    <dt>Documento</dt>
                    <dd>{debtor.document}</dd>
                    <dt>Contrato</dt>
                    <dd>{selected.reference}</dd>
                    <dt>Saldo original</dt>
                    <dd>{money(selected.amount)}</dd>
                  </DetailList>
                  <h3>Canais do contribuinte</h3>
                  <ContactChannels debtor={debtor} debtId={selected.id} disabled={blocked} />
                  <Button
                    disabled={scope.role === 'Financeiro'}
                    onClick={() => setEditingChannels(true)}
                  >
                    Editar canais
                  </Button>
                  <Status>{blocked ? 'Bloqueado' : 'Disponível'}</Status>
                  {blocked && (
                    <Alert $error>
                      Atendimento indisponível:{' '}
                      {scope.role === 'Financeiro'
                        ? 'seu perfil permite somente consulta e conciliação.'
                        : debtor.blocked
                          ? 'devedor bloqueado.'
                          : 'dívida contestada.'}
                    </Alert>
                  )}
                  <Link to={`/devedores/${debtor.id}`}>Abrir cadastro do devedor →</Link>
                  <Link to={`/negociacoes?divida=${selected.id}`}>
                    Encaminhar para negociação →
                  </Link>
                </Stack>
              </PanelBody>
            </Panel>
            <Panel>
              <PanelHeader>
                <h2>Histórico de atendimento</h2>
              </PanelHeader>
              <PanelBody>
                <Stack>
                  <p>
                    Contatos de {debtor.name} com{' '}
                    {db.creditors.find((c) => c.id === creditorOf(db, selected))?.name}.
                  </p>
                  <ContactTimeline
                    contacts={db.contacts.filter(
                      (c) => c.debtorId === debtor.id && c.creditorId === creditorOf(db, selected),
                    )}
                  />
                </Stack>
              </PanelBody>
            </Panel>
          </Split>
        ) : (
          <Empty>Fila concluída. Ajuste os filtros para consultar outros contratos.</Empty>
        )}
      </Stack>
      {editingChannels && selected && debtor && (
        <DebtorContactForm
          debtor={debtor}
          debtId={selected.id}
          onClose={() => setEditingChannels(false)}
        />
      )}
      {contactDebt && (
        <ContactDialog
          key={contactDebt.id}
          db={db}
          debt={contactDebt}
          disabled={
            scope.role === 'Financeiro' ||
            contactDebt.disputed ||
            !!db.debtors.find((d) => d.id === contactDebt.debtorId)?.blocked
          }
          onClose={() => setContactId('')}
          onSaved={() => {
            setContactId('');
            setSaved(true);
          }}
        />
      )}
    </>
  );
}
