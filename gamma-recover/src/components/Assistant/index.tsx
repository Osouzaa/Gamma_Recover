import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MessageCircle, Send, X } from 'lucide-react';
import { Button, Input } from '../ui';
import { answerQuestion, suggestedQuestions } from './knowledge';
import * as S from './styles';

type Message = { author: 'Você' | 'Assistente Gamma'; text: string; path?: string };

export function Assistant() {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const dialog = useRef<HTMLDialogElement>(null);
  const launcher = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const end = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();

  useEffect(() => {
    if (open) {
      dialog.current?.showModal();
      input.current?.focus();
    } else dialog.current?.close();
  }, [open]);

  useEffect(() => {
    if (open) end.current?.scrollIntoView({ block: 'nearest' });
  }, [messages, open]);

  function ask(value: string) {
    const text = value.trim().slice(0, 500);
    if (!text) return;
    const answer = answerQuestion(text);
    setMessages((previous) => [
      ...previous.slice(-38),
      { author: 'Você', text },
      { author: 'Assistente Gamma', ...answer },
    ]);
    setQuestion('');
    input.current?.focus();
  }

  return (
    <>
      <S.Launcher
        ref={launcher}
        $variant="primary"
        aria-label="Abrir assistente Gamma"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="assistente-gamma"
        onClick={() => setOpen(true)}
      >
        <MessageCircle aria-hidden="true" /> Assistente
      </S.Launcher>
      <S.Dialog
        id="assistente-gamma"
        ref={dialog}
        aria-labelledby="assistente-titulo"
        aria-describedby="assistente-limite"
        onCancel={() => setOpen(false)}
        onClose={() => {
          setOpen(false);
          launcher.current?.focus();
        }}
      >
        <header>
          <div>
            <h2 id="assistente-titulo">Assistente Gamma</h2>
            <small>Ajuda para usar a plataforma</small>
          </div>
          <Button aria-label="Fechar assistente" onClick={() => setOpen(false)}>
            <X aria-hidden="true" />
          </Button>
        </header>
        <S.Conversation>
          <div>
            <p>
              Olá! Posso orientar você sobre as funcionalidades e os próximos passos no sistema.
            </p>
            <small id="assistente-limite">
              Demonstração · Base local de ajuda, sem IA generativa. Não consulta sua carteira nem
              executa ações. Não informe dados pessoais.
            </small>
          </div>
          <S.Suggestions aria-label="Perguntas sugeridas">
            {suggestedQuestions(pathname).map((suggestion) => (
              <Button key={suggestion} onClick={() => ask(suggestion)}>
                {suggestion}
              </Button>
            ))}
          </S.Suggestions>
          <ol
            role="log"
            aria-label="Conversa com o assistente"
            aria-live="polite"
            aria-relevant="additions"
          >
            {messages.map((message, index) => (
              <li key={index} data-author={message.author}>
                <small>{message.author}</small>
                <p>{message.text}</p>
                {message.path && (
                  <Link to={message.path} onClick={() => setOpen(false)}>
                    Abrir tela relacionada →
                  </Link>
                )}
              </li>
            ))}
          </ol>
          <div ref={end} />
        </S.Conversation>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            ask(question);
          }}
        >
          <label htmlFor="pergunta-assistente">Sua dúvida sobre o sistema</label>
          <div>
            <Input
              id="pergunta-assistente"
              ref={input}
              autoFocus
              value={question}
              maxLength={500}
              placeholder="Como registrar um atendimento?"
              onChange={(event) => setQuestion(event.target.value)}
            />
            <Button
              type="submit"
              $variant="primary"
              disabled={!question.trim()}
              aria-label="Enviar pergunta"
            >
              <Send aria-hidden="true" />
            </Button>
          </div>
          {!!messages.length && (
            <Button
              type="button"
              $variant="ghost"
              onClick={() => {
                setMessages([]);
                setQuestion('');
                input.current?.focus();
              }}
            >
              Limpar conversa
            </Button>
          )}
        </form>
      </S.Dialog>
    </>
  );
}
