import { CalendarClock } from 'lucide-react';
import type { Contact } from '../../types/domain';
import { date, money } from '../../utils/format';
import { Muted } from '../ui';
import { Timeline } from './styles';
export function ContactTimeline({ contacts }: { contacts: Contact[] }) {
  if (!contacts.length) return <Muted>Nenhum atendimento registrado.</Muted>;
  return (
    <Timeline aria-label="Histórico de atendimentos">
      {[...contacts]
        .sort((a, b) => b.date.localeCompare(a.date))
        .map((c) => (
          <li key={c.id}>
            <header>
              <h3>{c.result}</h3>
              <time dateTime={c.date}>
                {date(c.date)} ·{' '}
                {new Date(c.date).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZone: 'America/Sao_Paulo',
                })}
              </time>
            </header>
            <Muted>
              {c.channel || 'Canal não informado'}
              {c.destination ? ` · ${c.destination}` : ''}
            </Muted>
            <p>{c.note}</p>
            {c.actor && <Muted>Registrado por {c.actor}</Muted>}
            {c.nextDate && (
              <footer>
                <CalendarClock />
                Retorno / promessa: {date(c.nextDate)}
                {c.promiseAmount ? ` · ${money(c.promiseAmount)}` : ''}
              </footer>
            )}
          </li>
        ))}
    </Timeline>
  );
}
