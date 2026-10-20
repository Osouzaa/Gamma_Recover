import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDatabase } from '../../hooks/useDatabase';
import { useWorkspace } from '../../app/providers/Context';
import { creditorOf } from '../../services/domain';
import { conversationChannel } from '../../services/messageChannels';
import { scopedDebts } from '../../services/operations';
import { ErrorState, LoadingState } from '../../components/Feedback';
import {
  Alert,
  Button,
  Empty,
  FilterBar,
  Input,
  PageHeader,
  Panel,
  PanelHeader,
  Stack,
  Select,
} from '../../components/ui';
import { Modal } from '../../components/Modal';
import { NewConversation } from './NewConversation';
import { ConversationPane } from './ConversationPane';
import { ChatLayout, ConversationButton, ConversationList } from './styles';
export default function Conversations() {
  const { data: db, isLoading, refetch } = useDatabase();
  const { scope } = useWorkspace();
  const [params] = useSearchParams();
  const [selectedId, setSelectedId] = useState('');
  const [search, setSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState('');
  const [creating, setCreating] = useState(false);
  const [integration, setIntegration] = useState(false);
  if (isLoading) return <LoadingState />;
  if (!db) return <ErrorState retry={refetch} />;
  const queryDebt = scopedDebts(db, scope).find((d) => d.id === params.get('divida'));
  const queryDebtor = db.debtors.find((d) => d.id === queryDebt?.debtorId);
  const conversations = (db.conversations || [])
    .filter((c) => !scope.creditorId || c.creditorId === scope.creditorId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const selected =
    conversations.find((c) => c.id === selectedId) ||
    (queryDebt && queryDebtor
      ? conversations.find(
          (c) => c.debtorId === queryDebtor.id && c.creditorId === creditorOf(db, queryDebt),
        )
      : conversations[0]);
  const groups = conversations.filter(
    (c, index, all) =>
      all.findIndex(
        (other) => other.debtorId === c.debtorId && other.creditorId === c.creditorId,
      ) === index,
  );
  const rows = groups.filter((c) => {
    const related = conversations.filter(
      (other) => other.debtorId === c.debtorId && other.creditorId === c.creditorId,
    );
    return (
      (!channelFilter || related.some((other) => conversationChannel(other) === channelFilter)) &&
      [
        db.debtors.find((d) => d.id === c.debtorId)?.name,
        db.creditors.find((v) => v.id === c.creditorId)?.name,
        ...related.map((other) => other.destination),
      ]
        .join(' ')
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  });
  return (
    <>
      <PageHeader
        title="Conversas"
        description="WhatsApp, e-mail e SMS em um histórico por contribuinte e empresa."
        actions={
          <Button
            $variant="primary"
            disabled={scope.role === 'Financeiro'}
            onClick={() => setCreating(true)}
          >
            Nova conversa
          </Button>
        }
      />
      <Stack>
        <Alert>
          Canais não conectados · Rascunhos e envios simulados locais. Nenhuma mensagem é enviada ou
          recebida. Elegibilidade Meta pendente para WhatsApp.{' '}
          <Button onClick={() => setIntegration(true)}>Ver integração</Button>
        </Alert>
        <ChatLayout>
          <Panel>
            <PanelHeader>
              <h2>Conversas locais</h2>
              <span>{groups.length}</span>
            </PanelHeader>
            <FilterBar>
              <Input
                aria-label="Buscar conversa"
                placeholder="Nome, empresa ou destino…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Select
                aria-label="Filtrar por canal"
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value)}
              >
                <option value="">Todos os canais</option>
                {['WhatsApp', 'E-mail', 'SMS'].map((channel) => (
                  <option key={channel}>{channel}</option>
                ))}
              </Select>
            </FilterBar>
            <ConversationList>
              {rows.length ? (
                rows.map((c) => (
                  <ConversationButton
                    key={c.id}
                    aria-pressed={
                      selected?.debtorId === c.debtorId && selected?.creditorId === c.creditorId
                    }
                    onClick={() => setSelectedId(c.id)}
                  >
                    <span>{db.debtors.find((d) => d.id === c.debtorId)?.name}</span>
                    <small>{db.creditors.find((v) => v.id === c.creditorId)?.name}</small>
                    <small>
                      {[
                        ...new Set(
                          conversations
                            .filter(
                              (other) =>
                                other.debtorId === c.debtorId && other.creditorId === c.creditorId,
                            )
                            .map(conversationChannel),
                        ),
                      ].join(' · ')}
                    </small>
                  </ConversationButton>
                ))
              ) : (
                <Empty>Nenhuma conversa nesta seleção. Prepare uma conversa para começar.</Empty>
              )}
            </ConversationList>
          </Panel>
          {selected ? (
            <ConversationPane
              key={selected.id}
              db={db}
              conversation={selected}
              initialDebtId={queryDebt?.id || ''}
              onOpen={setSelectedId}
            />
          ) : (
            <Panel>
              <Empty>
                <h2>{queryDebtor ? `Atender ${queryDebtor.name}` : 'Seu espaço de atendimento'}</h2>
                <p>
                  Selecione uma conversa ou prepare um atendimento vinculado à empresa e ao
                  contrato.
                </p>
                <Button disabled={scope.role === 'Financeiro'} onClick={() => setCreating(true)}>
                  Preparar conversa
                </Button>
              </Empty>
            </Panel>
          )}
        </ChatLayout>
      </Stack>
      {creating && (
        <NewConversation
          db={db}
          initialDebtId={queryDebt?.id || ''}
          onClose={() => setCreating(false)}
          onOpen={(id) => {
            setSelectedId(id);
            setCreating(false);
          }}
        />
      )}
      {integration && (
        <Modal title="Integração com a API oficial da Meta" onClose={() => setIntegration(false)}>
          <Stack>
            <Alert>Nenhum canal conectado. Não informe tokens ou credenciais nesta tela.</Alert>
            <p>
              E-mail e SMS exigem provedores, backend autenticado e retorno de status. Simulações
              não confirmam envio, entrega ou leitura. Não há troca automática de canal.
            </p>
            <p>
              A política oficial do WhatsApp Business inclui cobrança de dívidas entre os serviços
              proibidos. A elegibilidade do uso da Gamma precisa ser esclarecida com a Meta antes de
              qualquer ativação.
            </p>
            <a
              href="https://whatsappbusiness.com/policy/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Consultar política oficial do WhatsApp Business
            </a>

            <p>
              A conexão real exige backend autenticado, conta WhatsApp Business, número habilitado e
              webhooks HTTPS para receber mensagens e atualizar os estados.
            </p>
            <p>
              Ainda falta definir se será um número da Gamma ou um número por empresa. Essa decisão
              determina como as mensagens recebidas serão encaminhadas.
            </p>
            <p>
              O token da Meta ficará somente no servidor. O backend deverá validar acesso à empresa,
              destino e restrições antes de autorizar qualquer envio.
            </p>
            <p>
              Até a integração ser ativada, o sistema armazena rascunhos e simulações demonstrativas
              neste navegador.
            </p>
          </Stack>
        </Modal>
      )}
    </>
  );
}
