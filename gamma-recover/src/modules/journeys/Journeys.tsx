import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useWorkspace } from '../../app/providers/Context';
import { useAction, useDatabase } from '../../hooks/useDatabase';
import { JourneyService } from '../../services/journeys';
import type { Journey } from '../../services/journeySchema';
import { date } from '../../utils/format';
import { DataTable } from '../../components/DataTable';
import { ErrorState, Feedback, LoadingState } from '../../components/Feedback';
import {
  Alert,
  Button,
  Empty,
  PageHeader,
  Panel,
  PanelHeader,
  Row,
  Stack,
  Status,
} from '../../components/ui';
import { JourneyForm } from './JourneyForm';
import { Steps, SimulationSelect } from './styles';
export default function Journeys() {
  const { scope } = useWorkspace();
  const { data: db, isLoading, refetch } = useDatabase();
  const action = useAction();
  const [form, setForm] = useState<Journey | 'new'>();
  const [runId, setRunId] = useState('');
  if (isLoading) return <LoadingState />;
  if (!db) return <ErrorState retry={refetch} />;
  const journeys = (db.journeys || []).filter(
    (j) => !scope.creditorId || j.creditorId === scope.creditorId,
  );
  const runs = (db.journeyRuns || []).filter((r) => journeys.some((j) => j.id === r.journeyId));
  const run = runs.find((r) => r.id === runId) || runs.at(-1);
  return (
    <>
      <PageHeader
        title="Réguas de cobrança"
        description="Jornadas por empresa, com etapas relativas ao vencimento."
        actions={
          <Button
            $variant="primary"
            disabled={scope.role !== 'Administrador'}
            onClick={() => setForm('new')}
          >
            <Plus />
            Nova régua
          </Button>
        }
      />
      <Stack>
        <Alert>
          Ambiente demonstrativo: simulações não enviam mensagens, não criam tarefas e não confirmam
          contatos ou pagamentos.
        </Alert>
        <Feedback
          error={action.error}
          success={
            action.isSuccess
              ? 'Simulação registrada. Zero envios e zero tarefas executadas.'
              : undefined
          }
        />
        {!journeys.length && (
          <Empty>
            <h2>Nenhuma régua cadastrada</h2>
            <p>Crie etapas com canal, ação e dias antes ou depois do vencimento.</p>
          </Empty>
        )}
        {journeys.map((j) => (
          <Panel key={j.id}>
            <PanelHeader>
              <div>
                <h2>{j.name}</h2>
                <small>
                  {db.creditors.find((c) => c.id === j.creditorId)?.name} · revisão {j.revision}
                </small>
              </div>
              <Row>
                <Status>{j.active ? 'Ativa para simulação' : 'Pausada'}</Status>
                <Button disabled={scope.role !== 'Administrador'} onClick={() => setForm(j)}>
                  Editar régua
                </Button>
                <Button
                  disabled={!j.active || scope.role !== 'Administrador' || action.isPending}
                  onClick={() =>
                    action.mutate(async () => {
                      const result = await JourneyService.simulate(scope, j.id);
                      setRunId(result.id);
                    })
                  }
                >
                  Simular régua
                </Button>
              </Row>
            </PanelHeader>
            <Steps aria-label={`Etapas de ${j.name}`}>
              {j.steps.map((step, index) => (
                <li key={index}>
                  <h3>
                    {step.offset === 0
                      ? 'No vencimento'
                      : `${Math.abs(step.offset)} dias ${step.offset < 0 ? 'antes' : 'depois'}`}
                  </h3>
                  <p>{step.channel}</p>
                  <small>{step.note}</small>
                </li>
              ))}
            </Steps>
          </Panel>
        ))}
        <Panel>
          <PanelHeader>
            <h2>Histórico de simulações</h2>
            {runs.length > 0 && (
              <SimulationSelect
                aria-label="Simulação registrada"
                value={run?.id || ''}
                onChange={(e) => setRunId(e.target.value)}
              >
                {[...runs].reverse().map((r) => (
                  <option key={r.id} value={r.id}>
                    {journeys.find((j) => j.id === r.journeyId)?.name} · revisão {r.revision} ·{' '}
                    {date(r.date)} · {r.id.slice(-6)}
                  </option>
                ))}
              </SimulationSelect>
            )}
          </PanelHeader>
          {run ? (
            <>
              <Alert>
                {run.results.filter((r) => r.eligible).length} etapas elegíveis ·{' '}
                {run.results.filter((r) => !r.eligible).length} excluídas · 0 envios. Posição
                registrada em {date(run.date)} por {run.actor}; não representa elegibilidade atual
                nem entrega.
              </Alert>
              <DataTable
                rows={run.results.map((r, index) => ({ ...r, key: `${run.id}-${index}` }))}
                rowKey={(r) => r.key}
                columns={[
                  {
                    key: 'debt',
                    label: 'Contrato',
                    render: (r) => db.debts.find((d) => d.id === r.debtId)?.reference,
                  },
                  { key: 'step', label: 'Etapa', render: (r) => r.step + 1 },
                  { key: 'channel', label: 'Canal', render: (r) => r.channel },
                  { key: 'note', label: 'Ação prevista', render: (r) => r.note },
                  {
                    key: 'date',
                    label: 'Data prevista',
                    render: (r) => date(r.scheduledDate),
                    sortValue: (r) => r.scheduledDate,
                  },
                  {
                    key: 'status',
                    label: 'Resultado',
                    render: (r) => (r.eligible ? 'Elegível na simulação' : 'Excluída'),
                  },
                  {
                    key: 'reason',
                    label: 'Motivo',
                    render: (r) => r.reason || 'Ação apenas prevista; sem execução',
                  },
                ]}
              />
            </>
          ) : (
            <Empty>Simule uma régua para consultar os motivos de inclusão e exclusão.</Empty>
          )}
        </Panel>
      </Stack>
      {form && (
        <JourneyForm
          db={db}
          journey={form === 'new' ? undefined : form}
          onClose={() => setForm(undefined)}
        />
      )}
    </>
  );
}
