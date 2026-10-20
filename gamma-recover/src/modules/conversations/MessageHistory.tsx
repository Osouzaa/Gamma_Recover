import { useEffect, useRef } from 'react';
import type { Database } from '../../types/domain';
import type { ChatDraft, Conversation } from '../../types/conversations';
import {
  conversationChannel,
  displayDestination,
  messageDestination,
} from '../../services/messageChannels';
import { contactBlocked } from '../../services/domain';
import { useWorkspace } from '../../app/providers/Context';
import { Button, Empty, Muted, Row } from '../../components/ui';
import { DraftList } from './styles';

export function MessageHistory({
  db,
  conversation,
  pending,
  onEdit,
  onRemove,
  onSimulate,
}: {
  db: Database;
  conversation: Conversation;
  pending: boolean;
  onEdit: (draft: ChatDraft) => void;
  onRemove: (draft: ChatDraft) => void;
  onSimulate: (draft: ChatDraft, failed: boolean) => void;
}) {
  const { scope } = useWorkspace();
  const list = useRef<HTMLOListElement>(null);
  const person = db.debtors.find((d) => d.id === conversation.debtorId)!;
  const events = (db.conversations || [])
    .filter((c) => c.creditorId === conversation.creditorId && c.debtorId === conversation.debtorId)
    .flatMap((c) => [
      ...c.drafts.map((message) => ({ message, conversation: c, status: 'Rascunho local' })),
      ...(c.simulations || []).map((message) => ({
        message,
        conversation: c,
        status: message.outcome,
      })),
    ])
    .sort(
      (a, b) =>
        a.message.updatedAt.localeCompare(b.message.updatedAt) ||
        a.message.id.localeCompare(b.message.id),
    );
  const latest = events
    .map((event) => `${event.message.id}:${event.message.updatedAt}:${event.status}`)
    .join();
  useEffect(() => {
    if (list.current) list.current.scrollTop = list.current.scrollHeight;
  }, [latest]);
  return (
    <DraftList ref={list} aria-label="Histórico unificado de mensagens">
      {!events.length && (
        <Empty as="li">
          <h3>Conversa preparada</h3>
          <p>Escolha o canal e salve um rascunho. Simulações não enviam mensagens reais.</p>
        </Empty>
      )}
      {events.map(({ message, conversation: source, status }) => {
        const channel = conversationChannel(source);
        const debt = db.debts.find((d) => d.id === message.debtId);
        const canEdit =
          status === 'Rascunho local' &&
          source.id === conversation.id &&
          scope.role !== 'Financeiro' &&
          debt &&
          !contactBlocked(db, debt) &&
          messageDestination(person, channel) === source.destination;
        return (
          <li key={message.id}>
            <Muted>
              {channel} · {status} · {debt?.reference}
            </Muted>
            <small>{displayDestination(channel, source.destination)}</small>
            {message.subject && <h3>{message.subject}</h3>}
            <p>{message.text}</p>
            <small>
              {message.actor} ·{' '}
              {new Date(message.updatedAt).toLocaleString('pt-BR', {
                timeZone: 'America/Sao_Paulo',
              })}
            </small>
            {status !== 'Rascunho local' && (
              <p>
                <small>
                  {status === 'Falha simulada'
                    ? 'Falha escolhida no simulador. Revise o cadastro e prepare outro rascunho se necessário.'
                    : 'Simulação concluída localmente.'}{' '}
                  Nenhum envio, entrega ou leitura real.
                </small>
              </p>
            )}
            {source.id === conversation.id && status === 'Rascunho local' && (
              <Row>
                <Button disabled={!canEdit || pending} onClick={() => onEdit(message)}>
                  Editar rascunho
                </Button>
                <Button disabled={!canEdit || pending} onClick={() => onRemove(message)}>
                  Excluir rascunho
                </Button>
                <Button disabled={!canEdit || pending} onClick={() => onSimulate(message, false)}>
                  Simular envio
                </Button>
                <Button disabled={!canEdit || pending} onClick={() => onSimulate(message, true)}>
                  Simular falha
                </Button>
              </Row>
            )}
          </li>
        );
      })}
    </DraftList>
  );
}
