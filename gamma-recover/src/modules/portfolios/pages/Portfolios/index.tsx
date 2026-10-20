import { PortfolioDetail } from '../../PortfolioDetail';
import { PortfolioForm } from '../../PortfolioForm';
import { useState } from 'react';
import { Plus, Upload } from 'lucide-react';
import { useWorkspace } from '../../../../app/providers/Context';
import { useDatabase } from '../../../../hooks/useDatabase';
import type { Portfolio } from '../../../../types/domain';
import { money } from '../../../../utils/format';
import { DataTable } from '../../../../components/DataTable';
import { LoadingState, ErrorState } from '../../../../components/Feedback';
import {
  Button,
  FilterBar,
  Input,
  Metric,
  Metrics,
  Muted,
  PageHeader,
  Panel,
  Row,
  Select,
  Stack,
  Status,
} from '../../../../components/ui';
import { ImportDialog } from '../../ImportDialog';
export default function Portfolios() {
  const { data: db, isLoading, refetch } = useDatabase();
  const { creditorId, scope } = useWorkspace();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [editing, setEditing] = useState<Portfolio | null | undefined>();
  const [detail, setDetail] = useState('');
  const [importId, setImportId] = useState('');
  if (isLoading) return <LoadingState />;
  if (!db) return <ErrorState retry={refetch} />;
  const portfolios = db.portfolios.filter(
    (p) =>
      (!creditorId || p.creditorId === creditorId) &&
      p.name.toLowerCase().includes(search.toLowerCase()) &&
      (status === 'all' || p.active === (status === 'active')),
  );
  const debts = db.debts.filter((d) => portfolios.some((p) => p.id === d.portfolioId));
  const selected = db.portfolios.find((p) => p.id === detail);
  return (
    <>
      <PageHeader
        title="Carteiras"
        description="Organize contratos, credores e importações da operação."
        actions={
          <Button
            $variant="primary"
            disabled={scope.role !== 'Administrador'}
            onClick={() => setEditing(null)}
          >
            <Plus />
            Nova carteira
          </Button>
        }
      />
      <Stack>
        <Metrics>
          <Metric>
            <p>Carteiras na seleção</p>
            <strong>{portfolios.length}</strong>
            <Muted>{portfolios.filter((p) => p.active).length} ativas</Muted>
          </Metric>
          <Metric>
            <p>Contratos vinculados</p>
            <strong>{debts.length}</strong>
            <Muted>Documentos fictícios</Muted>
          </Metric>
          <Metric>
            <p>Saldo original</p>
            <strong>{money(debts.reduce((s, d) => s + d.amount, 0))}</strong>
            <Muted>Antes das negociações</Muted>
          </Metric>
        </Metrics>
        <Panel>
          <FilterBar>
            <Input
              aria-label="Buscar carteira"
              placeholder="Buscar por nome da carteira…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select
              aria-label="Status da carteira"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="all">Todas as situações</option>
              <option value="active">Ativas</option>
              <option value="inactive">Inativas</option>
            </Select>
          </FilterBar>
          <DataTable
            rows={portfolios}
            rowKey={(p) => p.id}
            columns={[
              {
                key: 'name',
                label: 'Carteira',
                render: (p) => (
                  <>
                    <h3>{p.name}</h3>
                    <small>{p.id.slice(0, 12)}</small>
                  </>
                ),
                sortValue: (p) => p.name,
              },
              {
                key: 'creditor',
                label: 'Empresa contratante',
                render: (p) => db.creditors.find((c) => c.id === p.creditorId)?.name,
              },
              {
                key: 'count',
                label: 'Contratos',
                render: (p) => db.debts.filter((d) => d.portfolioId === p.id).length,
                numeric: true,
              },
              {
                key: 'amount',
                label: 'Saldo original',
                numeric: true,
                render: (p) =>
                  money(
                    db.debts
                      .filter((d) => d.portfolioId === p.id)
                      .reduce((s, d) => s + d.amount, 0),
                  ),
                sortValue: (p) =>
                  db.debts.filter((d) => d.portfolioId === p.id).reduce((s, d) => s + d.amount, 0),
              },
              {
                key: 'status',
                label: 'Situação',
                render: (p) => <Status>{p.active ? 'Ativo' : 'Inativo'}</Status>,
              },
              {
                key: 'actions',
                label: 'Ações',
                render: (p) => (
                  <Row>
                    <Button onClick={() => setDetail(p.id)}>Detalhes</Button>
                    <Button disabled={scope.role !== 'Administrador'} onClick={() => setEditing(p)}>
                      Editar
                    </Button>
                    <Button
                      disabled={!p.active || scope.role !== 'Administrador'}
                      onClick={() => setImportId(p.id)}
                    >
                      <Upload />
                      CSV
                    </Button>
                  </Row>
                ),
              },
            ]}
          />
        </Panel>
      </Stack>
      {editing !== undefined && (
        <PortfolioForm portfolio={editing} onClose={() => setEditing(undefined)} />
      )}{' '}
      {importId && <ImportDialog portfolioId={importId} onClose={() => setImportId('')} />}{' '}
      {selected && <PortfolioDetail portfolio={selected} db={db} onClose={() => setDetail('')} />}
    </>
  );
}
