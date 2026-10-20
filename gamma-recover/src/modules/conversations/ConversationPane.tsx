import { isSuspended } from '../../services/domain';
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import type { Database } from '../../types/domain';
import type { Conversation } from '../../types/conversations';
import { useWorkspace } from '../../app/providers/Context';
import { useAction } from '../../hooks/useDatabase';
import { ConversationService } from '../../services/conversations';
import { contactDestination } from '../../services/contactChannels';
import { creditorOf } from '../../services/domain';
import { Feedback } from '../../components/Feedback';
import {
  Alert,
  Button,
  Empty,
  Field,
  Form,
  Muted,
  Panel,
  PanelBody,
  PanelHeader,
  Row,
  Select,
  Stack,
  Textarea,
} from '../../components/ui';
import { DraftList, ConversationWorkspace } from './styles';
import { ConversationContext } from './ConversationContext';
export function ConversationPane({
  db,
  conversation,
  initialDebtId,
}: {
  db: Database;
  conversation: Conversation;
  initialDebtId: string;
}) {
  const { scope } = useWorkspace();
  const action = useAction();
  const list = useRef<HTMLOListElement>(null);
  useEffect(() => {
    if (list.current) list.current.scrollTop = list.current.scrollHeight;
  }, [conversation.drafts.length]);
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
  const [editing, setEditing] = useState('');
  const selectedDebt = debts.find((d) => d.id === debtId);
  const numberChanged = contactDestination(debtor, 'WhatsApp') !== conversation.destination;
  const readOnly =
    scope.role === 'Financeiro' ||
    debtor.blocked ||
    !selectedDebt ||
    selectedDebt.disputed ||
    isSuspended(selectedDebt) ||
    numberChanged;
  return (
    <ConversationWorkspace>
      <Panel>
        <PanelHeader>
          <div>
            <h2>{debtor.name}</h2>
            <Muted>
              {company.name} · +{conversation.destination}
            </Muted>
          </div>
          <Link to={`/devedores/${debtor.id}`}>Abrir cadastro →</Link>
        </PanelHeader>
        {numberChanged && (
          <Alert $error>
            O WhatsApp do cadastro mudou. Esta conversa permanece para consulta; prepare outra
            conversa para o número atual.
          </Alert>
        )}
        <DraftList ref={list} aria-label="Rascunhos da conversa">
          {!conversation.drafts.length && (
            <Empty as="li">
              <h3>Conversa preparada</h3>
              <p>
                Escreva um rascunho abaixo. A troca real depende de elegibilidade na Meta e
                integração segura no backend.
              </p>
            </Empty>
          )}
          {conversation.drafts.map((draft) => (
            <li key={draft.id}>
              <Muted>
                Rascunho local · {db.debts.find((d) => d.id === draft.debtId)?.reference}
              </Muted>
              <p>{draft.text}</p>
              <small>
                {draft.actor} ·{' '}
                {new Date(draft.updatedAt).toLocaleString('pt-BR', {
                  timeZone: 'America/Sao_Paulo',
                })}
              </small>
              <Row>
                <Button
                  disabled={!!readOnly || action.isPending}
                  onClick={() => {
                    setText(draft.text);
                    setDebtId(draft.debtId);
                    setEditing(draft.id);
                    action.reset();
                  }}
                >
                  Editar rascunho
                </Button>
                <Button
                  disabled={!!readOnly || action.isPending}
                  onClick={() =>
                    action.mutate(
                      () => ConversationService.removeDraft(scope, conversation.id, draft.id),
                      {
                        onSuccess: () => {
                          if (editing === draft.id) {
                            setEditing('');
                            setText('');
                          }
                        },
                      },
                    )
                  }
                >
                  Excluir rascunho
                </Button>
              </Row>
            </li>
          ))}
        </DraftList>
        <PanelBody>
          <Stack>
            {readOnly && (
              <Alert $error>
                Conversa somente para consulta. Verifique o perfil, o número de WhatsApp e as
                restrições do contrato.
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
                    ),
                  {
                    onSuccess: () => {
                      setText('');
                      setEditing('');
                    },
                  },
                );
              }}
            >
              <Field>
                Contrato em atendimento
                <Select
                  aria-label="Contrato em atendimento"
                  value={debtId}
                  disabled={scope.role === 'Financeiro' || !!editing}
                  onChange={(e) => setDebtId(e.target.value)}
                >
                  <option value="">Selecione um contrato</option>
                  {debts.map((d) => (
                    <option key={d.id} value={d.id} disabled={d.disputed || isSuspended(d)}>
                      {d.reference}
                      {d.disputed ? ' · Contestada' : isSuspended(d) ? ' · Suspensa' : ''}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field>
                {editing ? 'Editar mensagem local' : 'Mensagem'}
                <Textarea
                  aria-label="Mensagem do chat"
                  placeholder="Escreva uma mensagem para preparar o atendimento…"
                  rows={3}
                  maxLength={4096}
                  value={text}
                  disabled={!!readOnly}
                  onChange={(e) => setText(e.target.value)}
                />
              </Field>
              <Row>
                <Button
                  $variant="primary"
                  disabled={!!readOnly || !text.trim() || action.isPending}
                >
                  {editing ? 'Atualizar rascunho' : 'Salvar rascunho'}
                </Button>
                {editing && (
                  <Button
                    type="button"
                    onClick={() => {
                      setText('');
                      setEditing('');
                    }}
                  >
                    Cancelar edição
                  </Button>
                )}
                <Button type="button" disabled aria-describedby="whatsapp-disconnected">
                  Enviar pelo WhatsApp
                </Button>
                <Muted>{text.length}/4096</Muted>
              </Row>
              <Muted id="whatsapp-disconnected">
                Envio indisponível: elegibilidade Meta pendente e backend não integrado. Rascunhos
                não são enviados, entregues ou lidos.
              </Muted>
            </Form>
          </Stack>
        </PanelBody>
      </Panel>
      <ConversationContext db={db} debt={selectedDebt} />
    </ConversationWorkspace>
  );
}
