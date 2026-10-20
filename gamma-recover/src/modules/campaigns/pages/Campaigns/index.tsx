import { AudienceDialog } from '../../AudienceDialog';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useWorkspace } from '../../../../app/providers/Context';
import { useAction, useDatabase } from '../../../../hooks/useDatabase';
import { CampaignService } from '../../../../services/operations';
import { date } from '../../../../utils/format';
import { DataTable } from '../../../../components/DataTable';
import { Modal } from '../../../../components/Modal';
import { Feedback, ErrorState, LoadingState } from '../../../../components/Feedback';
import {
  Alert,
  Button,
  Field,
  Form,
  Input,
  PageHeader,
  Panel,
  Row,
  Select,
  Stack,
  Status,
} from '../../../../components/ui';
export default function Campaigns() {
  const { scope } = useWorkspace();
  const { data: db, isLoading, refetch } = useDatabase();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [audienceId, setAudienceId] = useState('');
  const [feedback, setFeedback] = useState('');
  const [creditorId, setCreditorId] = useState('');
  const [minDays, setMinDays] = useState(30);
  const action = useAction();
  if (isLoading) return <LoadingState />;
  if (!db) return <ErrorState retry={refetch} />;
  return (
    <>
      <PageHeader
        title="Campanhas"
        description="Segmente o público e simule a preparação de campanhas de cobrança."
        actions={
          <Button
            $variant="primary"
            disabled={scope.role !== 'Administrador'}
            onClick={() => {
              setOpen(true);
              action.reset();
              setCreditorId(scope.creditorId || db.creditors[0].id);
            }}
          >
            <Plus />
            Nova campanha
          </Button>
        }
      />
      <Stack>
        <Alert>
          Nenhuma mensagem é enviada. Os resultados mostram apenas o público elegível selecionado na
          criação da campanha.
        </Alert>
        <Feedback error={action.error} success={action.isSuccess && !open ? feedback : undefined} />
        <Panel>
          <DataTable
            rows={db.campaigns.filter(
              (c) => !scope.creditorId || c.creditorId === scope.creditorId,
            )}
            rowKey={(c) => c.id}
            empty="Crie uma campanha para segmentar contratos demonstrativos."
            columns={[
              {
                key: 'name',
                label: 'Campanha',
                render: (c) => (
                  <>
                    <h3>{c.name}</h3>
                    <small>{date(c.createdAt)}</small>
                  </>
                ),
              },
              {
                key: 'creditor',
                label: 'Credor',
                render: (c) => db.creditors.find((v) => v.id === c.creditorId)?.name,
              },
              { key: 'segment', label: 'Segmentação', render: (c) => `Atraso ≥ ${c.minDays} dias` },
              {
                key: 'audience',
                label: 'Público elegível',
                render: (c) => `${c.audience.length} contratos`,
                numeric: true,
              },
              { key: 'status', label: 'Situação', render: (c) => <Status>{c.status}</Status> },
              {
                key: 'results',
                label: 'Resultado demonstrativo',
                render: (c) =>
                  c.status === 'Simulada'
                    ? `${c.audience.length} selecionados · 0 envios`
                    : 'Aguardando simulação',
              },
              {
                key: 'actions',
                label: 'Ações',
                render: (c) => (
                  <Row>
                    <Button onClick={() => setAudienceId(c.id)}>Ver público</Button>
                    <Button
                      disabled={
                        c.status !== 'Rascunho' ||
                        scope.role !== 'Administrador' ||
                        action.isPending
                      }
                      onClick={() =>
                        action.mutate(() => CampaignService.run(scope, c.id), {
                          onSuccess: () =>
                            setFeedback('Campanha simulada. Nenhuma mensagem foi enviada.'),
                        })
                      }
                    >
                      Simular campanha
                    </Button>
                  </Row>
                ),
              },
            ]}
          />
        </Panel>
      </Stack>
      {db.campaigns.find(
        (c) => c.id === audienceId && (!scope.creditorId || c.creditorId === scope.creditorId),
      ) && (
        <AudienceDialog
          campaign={db.campaigns.find((c) => c.id === audienceId)!}
          db={db}
          onClose={() => setAudienceId('')}
        />
      )}
      {open && (
        <Modal title="Nova campanha demonstrativa" onClose={() => setOpen(false)}>
          <Form
            onSubmit={(e) => {
              e.preventDefault();
              action.mutate(() => CampaignService.create(scope, { name, creditorId, minDays }), {
                onSuccess: () => {
                  setOpen(false);
                  setName('');
                  setFeedback(
                    'Campanha criada. O público foi selecionado; nenhuma mensagem foi enviada.',
                  );
                },
              });
            }}
          >
            <Field>
              Nome
              <Input
                value={name}
                minLength={3}
                maxLength={100}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </Field>
            <Field>
              Credor
              <Select
                value={creditorId}
                onChange={(e) => setCreditorId(e.target.value)}
                disabled={!!scope.creditorId}
              >
                {db.creditors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field>
              Atraso mínimo (dias)
              <Input
                type="number"
                min="0"
                step="1"
                value={minDays}
                onChange={(e) => setMinDays(e.target.valueAsNumber)}
                required
              />
            </Field>
            <Alert>Exclui contratos com acordo, contestação ou devedor bloqueado.</Alert>
            <Feedback error={action.error} />
            <Button $variant="primary" disabled={action.isPending}>
              Criar campanha
            </Button>
          </Form>
        </Modal>
      )}
    </>
  );
}
