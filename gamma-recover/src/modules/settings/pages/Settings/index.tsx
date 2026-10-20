import { SectionTabs } from '../../../../components/SectionTabs';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useWorkspace } from '../../../../app/providers/Context';
import { useAction, useDatabase } from '../../../../hooks/useDatabase';
import { SettingsService } from '../../../../services/admin';
import type { Creditor, Role } from '../../../../types/domain';
import { date, money } from '../../../../utils/format';
import { CreditorForm } from '../../../creditors/CreditorForm';
import { DataTable } from '../../../../components/DataTable';
import { ResetDemoDialog } from '../../../../components/ResetDemoDialog';
import { Feedback, ErrorState, LoadingState } from '../../../../components/Feedback';
import {
  Alert,
  Button,
  DetailList,
  Field,
  Form,
  Input,
  PageHeader,
  Panel,
  PanelBody,
  PanelHeader,
  Select,
  Split,
  Stack,
} from '../../../../components/ui';
export default function Settings() {
  const { scope, setCreditorId } = useWorkspace();
  const { data: db, isLoading, refetch } = useDatabase();
  const [tab, setTab] = useState('Credores e políticas');
  const [editing, setEditing] = useState<Creditor | null | undefined>();
  const [reset, setReset] = useState(false);
  const [days, setDays] = useState<number | undefined>();
  const action = useAction();
  if (isLoading) return <LoadingState />;
  if (!db) return <ErrorState retry={refetch} />;
  return (
    <>
      <PageHeader
        title="Configurações"
        description="Credores, políticas, perfis demonstrativos e trilha de auditoria."
      />
      <Stack>
        <SectionTabs
          label="Seção de configurações"
          options={['Credores e políticas', 'Usuários e permissões', 'Parâmetros', 'Auditoria']}
          value={tab}
          onChange={setTab}
          panelId="settings-panel"
        />
        <Feedback
          error={action.error}
          success={action.isSuccess ? 'Configuração demonstrativa atualizada.' : undefined}
        />
        <div id="settings-panel" role="tabpanel" aria-label={tab}>
          <Stack>
            {tab === 'Credores e políticas' && (
              <Panel>
                <PanelHeader>
                  <h2>Credores e políticas de negociação</h2>
                  <Button
                    $variant="primary"
                    disabled={scope.role !== 'Administrador' || !!scope.creditorId}
                    onClick={() => setEditing(null)}
                  >
                    <Plus />
                    Novo credor
                  </Button>
                </PanelHeader>
                <DataTable
                  rows={db.creditors.filter((c) => !scope.creditorId || c.id === scope.creditorId)}
                  rowKey={(c) => c.id}
                  columns={[
                    {
                      key: 'name',
                      label: 'Credor',
                      render: (c) => (
                        <>
                          <h3>{c.name}</h3>
                          <small>{c.document}</small>
                        </>
                      ),
                    },
                    {
                      key: 'discount',
                      label: 'Desconto máximo',
                      render: (c) => `${c.policy.maxDiscount}%`,
                    },
                    {
                      key: 'count',
                      label: 'Máximo parcelas',
                      render: (c) => c.policy.maxInstallments,
                    },
                    {
                      key: 'min',
                      label: 'Parcela mínima',
                      render: (c) => money(c.policy.minInstallment),
                    },
                    {
                      key: 'actions',
                      label: 'Política',
                      render: (c) => (
                        <Button
                          disabled={scope.role !== 'Administrador'}
                          onClick={() => setEditing(c)}
                        >
                          Editar credor
                        </Button>
                      ),
                    },
                  ]}
                />
              </Panel>
            )}
            {tab === 'Usuários e permissões' && (
              <Split>
                <Panel>
                  <PanelHeader>
                    <h2>Sessão demonstrativa</h2>
                  </PanelHeader>
                  <PanelBody>
                    <Stack>
                      <Alert>
                        A troca de perfil permite testar permissões de interface. Não ? autenticação
                        nem autorização de produção.
                      </Alert>
                      <Field>
                        Usuário / perfil ativo
                        <Select
                          value={db.settings.role}
                          onChange={(e) => {
                            const role = e.target.value as Role;
                            action.mutate(() => SettingsService.switchRole(scope, role));
                          }}
                        >
                          <option>Administrador</option>
                          <option>Operador</option>
                          <option>Financeiro</option>
                        </Select>
                      </Field>
                      <p>{db.settings.operatorName}</p>
                    </Stack>
                  </PanelBody>
                </Panel>
                <Panel>
                  <PanelHeader>
                    <h2>Permissões implementadas nos serviços</h2>
                  </PanelHeader>
                  <PanelBody>
                    <DetailList>
                      <dt>Administrador</dt>
                      <dd>Cadastros, políticas, cobrança, acordos e conciliação.</dd>
                      <dt>Operador</dt>
                      <dd>Consulta, atendimentos, bloqueios e negociação.</dd>
                      <dt>Financeiro</dt>
                      <dd>Consulta e conciliação de parcelas.</dd>
                    </DetailList>
                  </PanelBody>
                </Panel>
              </Split>
            )}
            {tab === 'Parâmetros' && (
              <Panel>
                <PanelHeader>
                  <h2>Operação demonstrativa</h2>
                </PanelHeader>
                <PanelBody>
                  <Form
                    onSubmit={(e) => {
                      e.preventDefault();
                      action.mutate(() =>
                        SettingsService.save(scope, days ?? db.settings.returnDays),
                      );
                    }}
                  >
                    <Field>
                      Prazo sugerido para retorno (dias)
                      <Input
                        type="number"
                        min="1"
                        max="30"
                        value={days ?? db.settings.returnDays}
                        onChange={(e) => setDays(e.target.valueAsNumber)}
                      />
                    </Field>
                    <Button
                      $variant="primary"
                      disabled={scope.role !== 'Administrador' || action.isPending}
                    >
                      Salvar parâmetros
                    </Button>
                    <Alert>
                      Persistência local neste navegador, somente para dados fictícios. Falhas de
                      gravação são exibidas sem confirmar a operação.
                    </Alert>
                    <Button
                      $variant="danger"
                      disabled={scope.role !== 'Administrador'}
                      type="button"
                      onClick={() => setReset(true)}
                    >
                      Restaurar demonstração
                    </Button>
                  </Form>
                </PanelBody>
              </Panel>
            )}
            {tab === 'Auditoria' && (
              <Panel>
                <DataTable
                  rows={db.audit.filter(
                    (a) => !scope.creditorId || a.creditorId === scope.creditorId,
                  )}
                  rowKey={(a) => a.id}
                  columns={[
                    {
                      key: 'date',
                      label: 'Data',
                      render: (a) => (
                        <>
                          {date(a.date)}
                          <small>
                            {new Date(a.date).toLocaleTimeString('pt-BR', {
                              timeZone: 'America/Sao_Paulo',
                            })}
                          </small>
                        </>
                      ),
                      sortValue: (a) => a.date,
                    },
                    { key: 'actor', label: 'Usuário', render: (a) => a.actor },
                    { key: 'action', label: 'Ação', render: (a) => a.action },
                    { key: 'entity', label: 'Registro', render: (a) => a.entityId.slice(0, 30) },
                  ]}
                />
              </Panel>
            )}
          </Stack>
        </div>
      </Stack>
      {editing !== undefined && (
        <CreditorForm creditor={editing} onClose={() => setEditing(undefined)} />
      )}{' '}
      {reset && (
        <ResetDemoDialog onClose={() => setReset(false)} onReset={() => setCreditorId('')} />
      )}
    </>
  );
}
