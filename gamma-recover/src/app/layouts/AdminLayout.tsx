import { Logo } from '../../components/Logo';
import { LogoutButton } from './LogoutButton';
import { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  Building2,
  ChevronRight,
  FlaskConical,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from 'lucide-react';
import { useDatabase } from '../../hooks/useDatabase';
import { useWorkspace } from '../providers/Context';
import { navigation } from '../routes/navigation';
import { Button, Row, Select } from '../../components/ui';
import { UserMenu } from './UserMenu';
import * as S from './styles';
export function AdminLayout() {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const sidebar = useRef<HTMLElement>(null);
  const { pathname } = useLocation();
  const { data } = useDatabase();
  const { creditorId, setCreditorId } = useWorkspace();
  const current = navigation.find((n) =>
    n.path === '/' ? pathname === '/' : pathname.startsWith(n.path),
  );
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement;
    sidebar.current?.querySelector('button')?.focus();
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
      if (event.key === 'Tab') {
        const items = sidebar.current?.querySelectorAll<HTMLElement>('a,button');
        if (!items?.length) return;
        const first = items[0],
          last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', keyboard);
    return () => {
      document.removeEventListener('keydown', keyboard);
      previous?.focus();
    };
  }, [open]);
  return (
    <S.Shell>
      <S.SkipLink href="#conteudo">Pular para o conteúdo</S.SkipLink>
      {open && <S.Backdrop aria-label="Fechar navegação" onClick={() => setOpen(false)} />}
      <S.Sidebar ref={sidebar} $open={open} $collapsed={collapsed} aria-label="Navegação principal">
        <S.Brand>
          <Logo inverse />
        </S.Brand>
        <S.MobileButton>
          <Button aria-label="Fechar menu" onClick={() => setOpen(false)}>
            <X />
            Fechar menu
          </Button>
        </S.MobileButton>
        <nav aria-label="Módulos">
          {navigation.map((item, i) => (
            <div key={item.path}>
              {(i === 0 || item.group !== navigation[i - 1].group) && (
                <S.Group>
                  <span data-label>{item.group}</span>
                </S.Group>
              )}
              <S.NavItem
                aria-label={item.label}
                title={collapsed ? item.label : undefined}
                to={item.path}
                end={item.path === '/'}
                onClick={() => setOpen(false)}
              >
                <item.icon />
                <span data-label>{item.label}</span>
              </S.NavItem>
            </div>
          ))}
        </nav>
        <S.SidebarBottom>
          <p data-footer-copy>
            Gamma Estratégia & Consultoria
            <br />
            Ambiente demonstrativo · v0.1
          </p>
        </S.SidebarBottom>
      </S.Sidebar>
      <S.Workspace $collapsed={collapsed}>
        <S.Header>
          <Row>
            <S.MobileButton>
              <Button
                aria-label="Abrir navegação"
                aria-expanded={open}
                onClick={() => setOpen(!open)}
              >
                <Menu />
              </Button>
            </S.MobileButton>
            <S.DesktopButton>
              <Button
                $variant="ghost"
                aria-label={collapsed ? 'Expandir navegação' : 'Recolher navegação'}
                title={collapsed ? 'Expandir navegação' : 'Recolher navegação'}
                onClick={() => setCollapsed(!collapsed)}
              >
                {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
              </Button>
            </S.DesktopButton>
            <S.Breadcrumb aria-label="Breadcrumb">
              <ol>
                <li>
                  <Link to="/">Gamma Recover</Link>
                </li>
                <li>
                  <ChevronRight size={12} />
                </li>
                <li aria-current={current?.path === pathname ? 'page' : undefined}>
                  {current?.path !== pathname && current ? (
                    <Link to={current.path}>{current.label}</Link>
                  ) : (
                    current?.label || 'Página'
                  )}
                </li>
                {current && current.path !== pathname && (
                  <>
                    <li>
                      <ChevronRight size={12} />
                    </li>
                    <li aria-current="page">Detalhes</li>
                  </>
                )}
              </ol>
            </S.Breadcrumb>
          </Row>
          <Row>
            <Building2 size={15} aria-hidden="true" />
            <Select
              aria-label="Empresa credora"
              value={creditorId}
              onChange={(e) => setCreditorId(e.target.value)}
            >
              <option value="">Todos os credores</option>
              {data?.creditors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <UserMenu settings={data?.settings} />
            <LogoutButton />
          </Row>
        </S.Header>
        <S.DemoBar>
          <FlaskConical />
          <span>
            Ambiente de demonstração · Dados fictícios · Nenhuma cobrança, mensagem ou pagamento
            real
          </span>
        </S.DemoBar>
        <S.Content id="conteudo" tabIndex={-1}>
          <Outlet />
        </S.Content>
      </S.Workspace>
    </S.Shell>
  );
}
