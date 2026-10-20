import { AdminGuard } from './AdminGuard';
import { lazy, Suspense } from 'react';
import { createBrowserRouter, Link, Outlet } from 'react-router-dom';
import { AdminLayout } from '../layouts/AdminLayout';
import { LoadingState } from '../../components/Feedback';
import { Empty } from '../../components/ui';
const Login = lazy(() => import('../../modules/auth/pages/Login'));
const Dashboard = lazy(() => import('../../modules/dashboard/pages/Dashboard'));
const Companies = lazy(() => import('../../modules/companies/Companies'));
const Portfolios = lazy(() => import('../../modules/portfolios/pages/Portfolios'));
const Debtors = lazy(() => import('../../modules/debtors/pages/Debtors'));
const DebtorDetail = lazy(() => import('../../modules/debtors/pages/Detail'));
const Conversations = lazy(() => import('../../modules/conversations/Conversations'));
const Collections = lazy(() => import('../../modules/collections/pages/Collections'));
const Negotiations = lazy(() => import('../../modules/negotiations/pages/Negotiations'));
const Agreements = lazy(() => import('../../modules/agreements/pages/Agreements'));
const Financial = lazy(() => import('../../modules/financial/pages/Financial'));
const Tasks = lazy(() => import('../../modules/tasks/Tasks'));
const Journeys = lazy(() => import('../../modules/journeys/Journeys'));
const Campaigns = lazy(() => import('../../modules/campaigns/pages/Campaigns'));
const Reports = lazy(() => import('../../modules/reports/pages/Reports'));
const Settings = lazy(() => import('../../modules/settings/pages/Settings'));
function Boundary() {
  return (
    <Suspense fallback={<LoadingState />}>
      <Outlet />
    </Suspense>
  );
}
function RouteError() {
  return (
    <Empty>
      <h1>Não foi possível abrir esta página</h1>
      <p>Recarregue a aplicação para tentar novamente.</p>
      <Link to="/">Voltar ao início</Link>
    </Empty>
  );
}
export const router = createBrowserRouter([
  {
    element: <Boundary />,
    errorElement: <RouteError />,
    children: [
      { path: 'login', element: <Login /> },
      {
        element: <AdminGuard />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              { index: true, element: <Dashboard /> },
              { path: 'empresas', element: <Companies /> },
              { path: 'carteiras', element: <Portfolios /> },
              { path: 'devedores', element: <Debtors /> },
              { path: 'devedores/:debtorId', element: <DebtorDetail /> },
              { path: 'conversas', element: <Conversations /> },
              { path: 'cobranca', element: <Collections /> },
              { path: 'negociacoes', element: <Negotiations /> },
              { path: 'acordos', element: <Agreements /> },
              { path: 'financeiro', element: <Financial /> },
              { path: 'tarefas', element: <Tasks /> },
              { path: 'reguas', element: <Journeys /> },
              { path: 'campanhas', element: <Campaigns /> },
              { path: 'relatorios', element: <Reports /> },
              { path: 'configuracoes', element: <Settings /> },
            ],
          },
        ],
      },
      {
        path: '*',
        element: (
          <Empty>
            <h1>Página não encontrada</h1>
            <Link to="/">Ir ao Dashboard</Link>
          </Empty>
        ),
      },
    ],
  },
]);
