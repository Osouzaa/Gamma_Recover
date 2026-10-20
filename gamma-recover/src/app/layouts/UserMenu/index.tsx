import { Link } from 'react-router-dom';
import { ChevronDown, Settings2 } from 'lucide-react';
import { useRef } from 'react';
import type { Database } from '../../../types/domain';
import { Avatar } from '../styles';
import { Menu, Trigger } from './styles';
export function UserMenu({ settings }: { settings?: Database['settings'] }) {
  const ref = useRef<HTMLDivElement>(null);
  const name = settings?.operatorName || 'Gamma Demo';
  const close = () => ref.current?.hidePopover();
  return (
    <>
      <Trigger aria-label="Menu do usuário" popoverTarget="user-menu">
        <Avatar>
          {name
            .split(' ')
            .slice(0, 2)
            .map((n) => n[0])
            .join('')}
        </Avatar>
        <ChevronDown size={13} />
      </Trigger>
      <Menu ref={ref} id="user-menu" popover="auto">
        <h3>{name}</h3>
        <p>{settings?.role} · Sessão demonstrativa</p>
        <Link to="/configuracoes" onClick={close}>
          <Settings2 size={15} />
          Perfil e configurações
        </Link>
      </Menu>
    </>
  );
}
