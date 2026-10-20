import { contactChannels, contactDestination } from '../../../../services/contactChannels';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDatabase } from '../../../../hooks/useDatabase';
import { useWorkspace } from '../../../../app/providers/Context';
import { scopedDebts } from '../../../../services/operations';
import { money } from '../../../../utils/format';
import { DataTable } from '../../../../components/DataTable';
import { ErrorState, LoadingState } from '../../../../components/Feedback';
import { FilterBar, Input, PageHeader, Panel, Select, Status } from '../../../../components/ui';
export default function Debtors() {
  const { data: db, isLoading, refetch } = useDatabase();
  const { scope } = useWorkspace();
  const [search, setSearch] = useState('');
  const [blocked, setBlocked] = useState('all');
  const [portfolio, setPortfolio] = useState('');
  const [channelFilter, setChannelFilter] = useState('');
  if (isLoading) return <LoadingState />;
  if (!db) return <ErrorState retry={refetch} />;
  const debts = scopedDebts(db, scope).filter((d) => !portfolio || d.portfolioId === portfolio);
  const rows = db.debtors.filter(
    (v) =>
      debts.some((d) => d.debtorId === v.id) &&
      `${v.name} ${v.document}`.toLowerCase().includes(search.toLowerCase()) &&
      (blocked === 'all' || v.blocked === (blocked === 'yes')) &&
      (!channelFilter ||
        (channelFilter === 'none'
          ? !contactChannels.some((channel) => contactDestination(v, channel))
          : contactChannels.some(
              (channel) => channel === channelFilter && contactDestination(v, channel),
            ))),
  );
  return (
    <>
      <PageHeader
        title="Devedores"
        description="Consulte dados fictícios, contratos e histórico de atendimento."
      />
      <Panel>
        <FilterBar>
          <Input
            aria-label="Buscar devedor"
            placeholder="Buscar por nome ou documento…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            aria-label="Carteira"
            value={portfolio}
            onChange={(e) => setPortfolio(e.target.value)}
          >
            <option value="">Todas as carteiras</option>
            {db.portfolios
              .filter((p) => !scope.creditorId || p.creditorId === scope.creditorId)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
          </Select>
          <Select
            aria-label="Filtrar por canal"
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
          >
            <option value="">Todos os canais</option>
            {contactChannels.map((channel) => (
              <option key={channel}>{channel}</option>
            ))}
            <option value="none">Sem canal utilizável</option>
          </Select>
          <Select
            aria-label="Bloqueio operacional"
            value={blocked}
            onChange={(e) => setBlocked(e.target.value)}
          >
            <option value="all">Todos os devedores</option>
            <option value="yes">Bloqueados</option>
            <option value="no">Liberados</option>
          </Select>
        </FilterBar>
        <DataTable
          rows={rows}
          rowKey={(d) => d.id}
          columns={[
            {
              key: 'name',
              label: 'Devedor',
              render: (d) => (
                <>
                  <h3>{d.name}</h3>
                  <small>{d.document}</small>
                </>
              ),
              sortValue: (d) => d.name,
            },
            {
              key: 'email',
              label: 'Canais cadastrados',
              render: (d) => (
                <>
                  {contactChannels
                    .filter((channel) => contactDestination(d, channel))
                    .join(' · ') || 'Sem canal utilizável'}
                  {d.preferredChannel && <small>Preferencial: {d.preferredChannel}</small>}
                </>
              ),
            },
            {
              key: 'debts',
              label: 'Dívidas',
              render: (d) => debts.filter((v) => v.debtorId === d.id).length,
              numeric: true,
            },
            {
              key: 'balance',
              label: 'Saldo original',
              render: (d) =>
                money(debts.filter((v) => v.debtorId === d.id).reduce((s, v) => s + v.amount, 0)),
              sortValue: (d) =>
                debts.filter((v) => v.debtorId === d.id).reduce((s, v) => s + v.amount, 0),
              numeric: true,
            },
            {
              key: 'status',
              label: 'Operação',
              render: (d) => <Status>{d.blocked ? 'Bloqueado' : 'Liberado'}</Status>,
            },
            {
              key: 'actions',
              label: 'Ações',
              render: (d) => <Link to={`/devedores/${d.id}`}>Abrir cadastro →</Link>,
            },
          ]}
        />
      </Panel>
    </>
  );
}
