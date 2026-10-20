import { Link } from 'react-router-dom';
import styled from 'styled-components';
import type { Debtor } from '../../types/domain';
import { contactChannels, contactDestination, contactHref } from '../../services/contactChannels';
import { Button, Muted, Stack } from '../ui';
const ChannelRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid ${({ theme }) => theme.border.subtle};
  > div {
    min-width: 0;
    overflow-wrap: anywhere;
  }
  p {
    margin: 0;
    overflow-wrap: anywhere;
  }
  small {
    display: block;
    color: ${({ theme }) => theme.text.secondary};
  }
`;
export function ContactChannels({
  debtor,
  disabled = false,
  debtId,
}: {
  debtor: Debtor;
  disabled?: boolean;
  debtId?: string;
}) {
  return (
    <Stack>
      <div>
        {contactChannels.map((channel) => {
          const value =
            channel === 'WhatsApp'
              ? debtor.whatsapp
              : channel === 'Telefone'
                ? debtor.phone
                : debtor.email;
          const href = !disabled && !debtor.blocked ? contactHref(debtor, channel) : undefined;
          const label =
            channel === 'WhatsApp'
              ? 'Abrir WhatsApp'
              : channel === 'Telefone'
                ? 'Ligar'
                : 'Escrever e-mail';
          return (
            <ChannelRow key={channel}>
              <div>
                <p>
                  {channel}
                  {debtor.preferredChannel === channel ? ' · Preferencial' : ''}
                </p>
                <small>{value || 'Não informado'}</small>
                {!!value && !contactDestination(debtor, channel) && (
                  <small>Dado fictício ou sem formato utilizável</small>
                )}
              </div>
              {href ? (
                <Button
                  as="a"
                  href={href}
                  target={channel === 'WhatsApp' ? '_blank' : undefined}
                  rel={channel === 'WhatsApp' ? 'noopener noreferrer' : undefined}
                >
                  {label}
                </Button>
              ) : (
                <Button type="button" disabled>
                  {label}
                </Button>
              )}
            </ChannelRow>
          );
        })}
      </div>
      {debtId &&
        (!disabled && !debtor.blocked && contactDestination(debtor, 'WhatsApp') ? (
          <Button as={Link} to={`/conversas?divida=${encodeURIComponent(debtId)}`}>
            Abrir chat no sistema
          </Button>
        ) : (
          <Button type="button" disabled>
            Abrir chat no sistema
          </Button>
        ))}
      <Muted>
        {disabled || debtor.blocked
          ? 'Contato indisponível neste contexto: verifique o perfil, bloqueio ou contestação.'
          : 'As ações externas abrem seu aplicativo. No chat do sistema, rascunhos aguardam a integração Meta. Registre o resultado de contatos realizados.'}
      </Muted>
    </Stack>
  );
}
