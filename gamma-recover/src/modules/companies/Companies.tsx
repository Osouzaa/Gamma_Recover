import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../../app/providers/Context';
import { useDatabase } from '../../hooks/useDatabase';
import type { Creditor } from '../../types/domain';
import { CompanyForm } from './CompanyForm';
import { CompanyDetail } from './CompanyDetail';
import { CreditorForm } from '../creditors/CreditorForm';
import { DataTable } from '../../components/DataTable';
import { ErrorState, LoadingState } from '../../components/Feedback';
import { Button, FilterBar, Input, PageHeader, Panel, Row } from '../../components/ui';
export default function Companies() {
  const { data: db, isLoading, refetch } = useDatabase();
  const { scope, setCreditorId } = useWorkspace();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Creditor | null | undefined>();
  const [detailId, setDetailId] = useState('');
  const [policyId, setPolicyId] = useState('');
  if (isLoading) return <LoadingState />;
  if (!db) return <ErrorState retry={refetch} />;
  const rows = db.creditors.filter(
    (c) =>
      (!scope.creditorId || scope.creditorId === c.id) &&
      [c.name, c.document, c.profile?.tradeName]
        .join(' ')
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const detail = db.creditors.find((c) => c.id === detailId);
  const policy = db.creditors.find((c) => c.id === policyId);
  return (
    <>
      <PageHeader
        title="Empresas"
        description="Empresas contratantes, contatos, contratos de serviços e carteiras vinculadas."
        actions={
          <Button
            $variant="primary"
            disabled={scope.role !== 'Administrador' || !!scope.creditorId}
            onClick={() => setEditing(null)}
          >
            Nova empresa
          </Button>
        }
      />
      <Panel>
        <FilterBar>
          <Input
            aria-label="Buscar empresa"
            placeholder="Razão social, nome fantasia ou documento…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </FilterBar>
        <DataTable
          rows={rows}
          rowKey={(c) => c.id}
          columns={[
            {
              key: 'name',
              label: 'Empresa contratante',
              render: (c) => (
                <>
                  <h3>{c.name}</h3>
                  <small>{c.document}</small>
                </>
              ),
              sortValue: (c) => c.name,
            },
            {
              key: 'contact',
              label: 'Contato',
              render: (c) =>
                c.profile ? (
                  <>
                    {c.profile.contactName}
                    <small>{c.profile.email}</small>
                    <small>{c.profile.phone}</small>
                  </>
                ) : (
                  'Cadastro a complementar'
                ),
            },
            {
              key: 'manager',
              label: 'Responsável Gamma',
              render: (c) => c.profile?.manager || 'Não informado',
            },
            {
              key: 'portfolios',
              label: 'Carteiras',
              render: (c) => db.portfolios.filter((p) => p.creditorId === c.id).length,
              numeric: true,
            },
            {
              key: 'actions',
              label: 'Ações',
              render: (c) => (
                <Row>
                  <Button onClick={() => setDetailId(c.id)}>Detalhes</Button>
                  <Button disabled={scope.role !== 'Administrador'} onClick={() => setEditing(c)}>
                    Editar empresa
                  </Button>
                  <Button
                    disabled={scope.role !== 'Administrador'}
                    onClick={() => setPolicyId(c.id)}
                  >
                    Política
                  </Button>
                  <Button
                    onClick={() => {
                      setCreditorId(c.id);
                      navigate('/carteiras');
                    }}
                  >
                    Carteiras
                  </Button>
                </Row>
              ),
            },
          ]}
        />
      </Panel>
      {editing !== undefined && (
        <CompanyForm company={editing} onClose={() => setEditing(undefined)} />
      )}
      {detail && <CompanyDetail company={detail} db={db} onClose={() => setDetailId('')} />}
      {policy && <CreditorForm creditor={policy} onClose={() => setPolicyId('')} />}
    </>
  );
}
