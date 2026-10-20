import { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { Modal } from '../../components/Modal';
import { Link } from 'react-router-dom';
import type { Database } from '../../types/domain';
import type { ChatDraft, Conversation, MessageChannel } from '../../types/conversations';
import { useWorkspace } from '../../app/providers/Context';
import { useAction } from '../../hooks/useDatabase';
import { ConversationService } from '../../services/conversations';
import {
  conversationChannel,
  displayDestination,
  messageChannels,
  messageDestination,
  messageLimit,
} from '../../services/messageChannels';
import { contactBlocked, creditorOf, isSuspended } from '../../services/domain';
import { Feedback } from '../../components/Feedback';
import {
  Alert,
  Button,
  Field,
  Form,
  Input,
  Muted,
  Panel,
  PanelBody,
  PanelHeader,
  Row,
  Select,
  Stack,
  Textarea,
} from '../../components/ui';
import { ConversationWorkspace } from './styles';
import { ConversationContext } from './ConversationContext';
import { MessageHistory } from './MessageHistory';

export function ConversationPane({
  db,
  conversation,
  initialDebtId,
  onOpen,
}: {
  db: Database;
  conversation: Conversation;
  initialDebtId: string;
  onOpen: (id: string) => void;
}) {
  const { scope } = useWorkspace();
  const action = useAction();
  const debtor = db.debtors.find((d) => d.id === conversation.debtorId)!;
  const company = db.creditors.find((c) => c.id === conversation.creditorId)!;
  const debts = db.debts.filter(
    (d) => d.debtorId === debtor.id && creditorOf(db, d) === company.id,
  );
  const [debtId, setDebtId] = useState(
    debts.find((d) => d.id === initialDebtId)?.id ||
      debts.find((d) => !d.disputed && !isSuspended(d))?.id ||
      '',
  );
  const [text, setText] = useState('');
  const [subject, setSubject] = useState('');
  const [editing, setEditing] = useState('');
  const [optionsOpen, setOptionsOpen] = useState(false);
  const selectedDebt = debts.find((d) => d.id === debtId);
  const channel = conversationChannel(conversation);
  const destinationChanged = messageDestination(debtor, channel) !== conversation.destination;
  const readOnly =
    scope.role === 'Financeiro' ||
    !selectedDebt ||
    contactBlocked(db, selectedDebt) ||
    destinationChanged;
  const limit = messageLimit(channel);
  const clear = () => {
    setText('');
    setSubject('');
    setEditing('');
  };
  function edit(draft: ChatDraft) {
    setText(draft.text);
    setSubject(draft.subject || '');
    setDebtId(draft.debtId);
    setEditing(draft.id);
    action.reset();
  }
  return (
    <ConversationWorkspace>
      <Panel>
        <PanelHeader>
          <div>
            <h2>{debtor.name}</h2>
            <Muted>
              {company.name} · {channel} · {displayDestination(channel, conversation.destination)}
            </Muted>
          </div>
          <Link to={`/devedores/${debtor.id}`}>Abrir cadastro →</Link>
        </PanelHeader>
        {destinationChanged && (
          <PanelBody>
            <Alert $error>
              O destino do cadastro mudou. Histórico preservado para consulta; prepare uma nova
              conversa para o contato atual.
            </Alert>
          </PanelBody>
        )}
        <MessageHistory
          db={db}
          conversation={conversation}
          pending={action.isPending || !!editing}
          onEdit={edit}
          onRemove={(draft) =>
            action.mutate(() => ConversationService.removeDraft(scope, conversation.id, draft.id))
          }
          onSimulate={(draft, failed) =>
            action.mutate(() =>
              ConversationService.simulate(
                scope,
                conversation.id,
                draft.id,
                failed ? 'Falha simulada' : 'Envio simulado',
              ),
            )
          }
        />
        <PanelBody>
          <Stack>
            {readOnly && (
              <Alert $error>
                Conversa somente para consulta. Verifique perfil, destino e restrições do contrato.
              </Alert>
            )}
            <Feedback error={action.error} />
            <Form
              onSubmit={(e) => {
                e.preventDefault();
                action.mutate(
                  () =>
                    ConversationService.saveDraft(
                      scope,
                      conversation.id,
                      debtId,
                      text,
                      editing || undefined,
                      subject,
                    ),
                  { onSuccess: clear },
                );
              }}
            >
              <Muted>
                {channel} · {selectedDebt?.reference || 'Sem contrato selecionado'}
              </Muted>
              {channel === 'E-mail' && (
                <Field>
                  Assunto do e-mail
                  <Input
                    aria-label="Assunto do e-mail"
                    required
                    maxLength={150}
                    value={subject}
                    disabled={!!readOnly}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </Field>
              )}
              <Field>
                {editing ? 'Editar mensagem local' : 'Mensagem'}
                <Textarea
                  aria-label="Mensagem do chat"
                  placeholder="Escreva uma mensagem para revisar…"
                  rows={3}
                  maxLength={limit}
                  value={text}
                  disabled={!!readOnly}
                  onChange={(e) => setText(e.target.value)}
                />
              </Field>
              <Row>
                <Button
                  $variant="primary"
                  disabled={
                    !!readOnly ||
                    !text.trim() ||
                    (channel === 'E-mail' && !subject.trim()) ||
                    action.isPending
                  }
                >
                  {editing ? 'Atualizar rascunho' : 'Salvar rascunho'}
                </Button>
                {(text || editing || subject) && (
                  <Button type="button" onClick={clear}>
                    {editing ? 'Cancelar edição' : 'Descartar texto'}
                  </Button>
                )}
                <Button type="button" disabled>
                  Enviar{' '}
                  {channel === 'E-mail'
                    ? 'por e-mail'
                    : channel === 'SMS'
                      ? 'por SMS'
                      : 'pelo WhatsApp'}
                </Button>
                <Button
                  type="button"
                  onClick={() => setOptionsOpen(true)}
                  disabled={action.isPending}
                  aria-haspopup="dialog"
                >
                  <SlidersHorizontal size={15} />
                  Opções da mensagem
                </Button>
                <Muted>
                  {text.length}/{limit}
                </Muted>
              </Row>
              <Muted>
                Envio real indisponível. Salve o rascunho e use Simular envio ou Simular falha no
                histórico. Não há entrega, leitura, custo nem troca automática de canal.
                {channel === 'SMS' &&
                  ' Limite demonstrativo de 160 caracteres; segmentação e codificação do provedor ainda não implementadas.'}
              </Muted>
            </Form>
          </Stack>
        </PanelBody>
      </Panel>
      {optionsOpen && (
        <Modal
          title="Opções da mensagem"
          onClose={() => {
            if (!action.isPending) setOptionsOpen(false);
          }}
        >
          <Stack>
            <Field>
              Canal em atendimento
              <Select
                aria-label="Canal em atendimento"
                value={channel}
                disabled={
                  scope.role === 'Financeiro' ||
                  !selectedDebt ||
                  contactBlocked(db, selectedDebt) ||
                  !!text ||
                  !!subject ||
                  !!editing ||
                  action.isPending
                }
                onChange={(e) => {
                  const nextChannel = e.target.value as MessageChannel;
                  action.mutate(() => ConversationService.open(scope, debtId, nextChannel), {
                    onSuccess: (id) => onOpen(String(id)),
                  });
                }}
              >
                {messageChannels.map((value) => (
                  <option key={value} value={value} disabled={!messageDestination(debtor, value)}>
                    {value}
                    {!messageDestination(debtor, value) ? ' · Sem destino válido' : ''}
                  </option>
                ))}
              </Select>
            </Field>
            <Muted>
              Preferência cadastrada: {debtor.preferredChannel || 'não informada'}. Preferência não
              confirma consentimento. Salve ou descarte o texto antes de trocar de canal.
            </Muted>
            <Field>
              Contrato em atendimento
              <Select
                aria-label="Contrato em atendimento"
                value={debtId}
                disabled={scope.role === 'Financeiro' || !!editing || !!text || !!subject}
                onChange={(e) => setDebtId(e.target.value)}
              >
                <option value="">Selecione um contrato</option>
                {debts.map((debt) => (
                  <option
                    key={debt.id}
                    value={debt.id}
                    disabled={debt.disputed || isSuspended(debt)}
                  >
                    {debt.reference}
                    {debt.disputed ? ' · Contestada' : isSuspended(debt) ? ' · Suspensa' : ''}
                  </option>
                ))}
              </Select>
            </Field>
            <Field>
              Modelo de mensagem
              <Select
                aria-label="Modelo de mensagem"
                value=""
                disabled={!!readOnly || !!text}
                onChange={(e) => {
                  if (!e.target.value) return;
                  setText(
                    e.target.value === 'retorno'
                      ? 'Olá! Aqui é a equipe Gamma. Podemos combinar um horário para conversar? Esta é uma mensagem demonstrativa.'
                      : 'Olá! Aqui é a equipe Gamma. Estamos disponíveis para esclarecer suas dúvidas. Esta é uma mensagem demonstrativa.',
                  );
                  if (channel === 'E-mail') setSubject('Atendimento Gamma');
                  setOptionsOpen(false);
                }}
              >
                <option value="">Escrever do zero ou escolher um modelo</option>
                <option value="apresentacao">Apresentação</option>
                <option value="retorno">Combinar retorno</option>
              </Select>
            </Field>
            <Feedback error={action.error} />
            <Button type="button" disabled={action.isPending} onClick={() => setOptionsOpen(false)}>
              Concluir
            </Button>
          </Stack>
        </Modal>
      )}
      <ConversationContext db={db} debt={selectedDebt} />
    </ConversationWorkspace>
  );
}
