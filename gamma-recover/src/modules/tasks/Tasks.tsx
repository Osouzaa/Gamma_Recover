import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useWorkspace } from '../../app/providers/Context';
import { useAction, useDatabase } from '../../hooks/useDatabase';
import { taskRows, TaskService } from '../../services/tasks';
import { creditorOf } from '../../services/domain';
import { date, money } from '../../utils/format';
import { SectionTabs } from '../../components/SectionTabs';
import { DataTable } from '../../components/DataTable';
import { ErrorState, Feedback, LoadingState } from '../../components/Feedback';
import {
  Button,
  ContextDetails,
  Empty,
  Input,
  PageHeader,
  Panel,
  PanelBody,
  PanelHeader,
  Stack,
  Status,
} from '../../components/ui';
import { TaskForm } from './TaskForm';
import { TaskLayout, TaskFilters } from './styles';
export default function Tasks() {
  const { scope } = useWorkspace();
  const { data: db, isLoading, refetch } = useDatabase();
  const action = useAction();
  const [tab, setTab] = useState('Todas');
  const [search, setSearch] = useState('');
  const [mine, setMine] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [creating, setCreating] = useState(false);
  if (isLoading) return <LoadingState />;
  if (!db) return <ErrorState retry={refetch} />;
  const all = taskRows(db, scope.creditorId);
  const status = {
    Hoje: 'Hoje',
    Atrasadas: 'Atrasada',
    Futuras: 'Futura',
    Concluídas: 'Concluída',
  }[tab];
  const rows = all.filter(
    (t) =>
      (!status || t.status === status) &&
      (!mine || t.responsible === db.settings.operatorName) &&
      `${t.title} ${t.debtor.name} ${t.debt.reference} ${t.responsible}`
        .toLocaleLowerCase('pt-BR')
        .includes(search.toLocaleLowerCase('pt-BR')),
  );
  const selected = rows.find((t) => t.id === selectedId) || rows[0];
  return (
    <>
      <PageHeader
        title="Tarefas"
        description="Próximas ações por contrato, prazos e responsável demonstrativo."
        actions={
          <Button
            $variant="primary"
            disabled={scope.role === 'Financeiro'}
            onClick={() => setCreating(true)}
          >
            <Plus />
            Nova tarefa
          </Button>
        }
      />
      <Stack>
        <Feedback
          error={action.error}
          success={
            action.isSuccess ? 'Tarefa concluída. Nenhuma baixa financeira realizada.' : undefined
          }
        />
        <SectionTabs
          label="Situação das tarefas"
          options={['Todas', 'Hoje', 'Atrasadas', 'Futuras', 'Concluídas']}
          value={tab}
          onChange={setTab}
          panelId="tasks-panel"
        />
        <div id="tasks-panel" role="tabpanel" aria-label={tab}>
          <TaskLayout>
            <Panel>
              <TaskFilters>
                <Input
                  aria-label="Buscar tarefas"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Pessoa, contrato, ação ou responsável"
                />
                <label>
                  <input
                    type="checkbox"
                    checked={mine}
                    onChange={(e) => setMine(e.target.checked)}
                  />
                  Somente minhas
                </label>
                <span>{rows.length} tarefas</span>
              </TaskFilters>
              <DataTable
                rows={rows}
                rowKey={(t) => t.id}
                selectedRowKey={selected?.id}
                empty="Sem tarefas neste filtro. Crie uma tarefa ou agende um retorno no atendimento."
                columns={[
                  { key: 'status', label: 'Situação', render: (t) => <Status>{t.status}</Status> },
                  {
                    key: 'date',
                    label: 'Prazo',
                    render: (t) => date(t.dueDate),
                    sortValue: (t) => t.dueDate,
                  },
                  {
                    key: 'person',
                    label: 'Pessoa / contrato',
                    render: (t) => (
                      <>
                        <h3>{t.debtor.name}</h3>
                        <small>{t.debt.reference}</small>
                      </>
                    ),
                  },
                  { key: 'action', label: 'Próxima ação', render: (t) => t.title },
                  { key: 'responsible', label: 'Responsável', render: (t) => t.responsible },
                  {
                    key: 'details',
                    label: 'Detalhes',
                    render: (t) => (
                      <Button
                        aria-pressed={selected?.id === t.id}
                        onClick={() => setSelectedId(t.id)}
                      >
                        Abrir
                      </Button>
                    ),
                  },
                ]}
              />
            </Panel>
            {selected ? (
              <Panel>
                <PanelHeader>
                  <h2>Detalhes da tarefa</h2>
                </PanelHeader>
                <PanelBody>
                  <Stack>
                    <h3>{selected.debtor.name}</h3>
                    <ContextDetails>
                      <dt>Empresa</dt>
                      <dd>
                        {db.creditors.find((c) => c.id === creditorOf(db, selected.debt))?.name}
                      </dd>
                      <dt>Contrato</dt>
                      <dd>{selected.debt.reference}</dd>
                      <dt>Valor original</dt>
                      <dd>{money(selected.debt.amount)}</dd>
                      <dt>Próxima ação</dt>
                      <dd>{selected.title}</dd>
                      <dt>Responsável</dt>
                      <dd>{selected.responsible}</dd>
                      <dt>Prazo</dt>
                      <dd>{date(selected.dueDate)}</dd>
                      {selected.completedBy && (
                        <>
                          <dt>Concluída por</dt>
                          <dd>{selected.completedBy}</dd>
                        </>
                      )}
                    </ContextDetails>
                    <Button
                      disabled={
                        !!selected.completedAt || scope.role === 'Financeiro' || action.isPending
                      }
                      onClick={() => action.mutate(() => TaskService.complete(scope, selected.id))}
                    >
                      Concluir tarefa
                    </Button>
                    <Link to={`/cobranca?divida=${selected.debtId}`}>Abrir atendimento →</Link>
                    <Link to={`/devedores/${selected.debtor.id}`}>Consultar cadastro →</Link>
                  </Stack>
                </PanelBody>
              </Panel>
            ) : (
              <Empty>Selecione uma tarefa para consultar seus detalhes.</Empty>
            )}
          </TaskLayout>
        </div>
        <p>
          Retornos e promessas registrados nesta versão geram tarefas. Registros antigos são
          preservados sem atribuir contrato ou responsável retroativamente.
        </p>
      </Stack>
      {creating && <TaskForm db={db} onClose={() => setCreating(false)} />}
    </>
  );
}
