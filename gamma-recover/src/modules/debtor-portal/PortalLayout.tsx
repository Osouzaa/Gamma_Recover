import { useEffect, useState } from 'react';
import { Navigate, Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import { Button, Alert, Stack } from '../../components/ui';
import { closePortalSession, portalSession, portalRemaining } from '../../services/portalSession';
import { PortalContent, PortalHeader, PortalNav, PortalShell } from './styles';
export function PortalLayout() {
  const navigate = useNavigate();
  const session = portalSession();
  return (
    <PortalShell>
      <PortalHeader>
        <Link to="/portal">
          <strong>
            <span>Γ</span> gamma recover
          </strong>
        </Link>
        <div>Portal de negociação · demonstração</div>
        {session && (
          <Button
            onClick={() => {
              closePortalSession();
              navigate('/portal');
            }}
          >
            Sair da sessão demo
          </Button>
        )}
      </PortalHeader>
      <PortalContent>
        <Stack>
          <Alert>
            Ambiente demonstrativo. Somente pessoas e dívidas fictícias. Não informe CPF, telefone
            ou qualquer dado pessoal real.
          </Alert>
          {session && (
            <PortalNav>
              <NavLink to="/portal/dividas">Minhas dívidas</NavLink>
              <NavLink to="/portal/acordos">Meus acordos</NavLink>
              <NavLink to="/portal/ajuda">Ajuda e contestação</NavLink>
            </PortalNav>
          )}
          <Outlet />
        </Stack>
      </PortalContent>
    </PortalShell>
  );
}
export function PortalGuard() {
  const [, update] = useState(0);
  useEffect(() => {
    const timer = window.setTimeout(() => update((v) => v + 1), portalRemaining() + 20);
    return () => window.clearTimeout(timer);
  }, []);
  return portalSession() ? <Outlet /> : <Navigate to="/portal" replace />;
}
