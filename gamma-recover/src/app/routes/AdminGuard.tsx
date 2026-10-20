import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../providers/AdminAuth';
export function AdminGuard() {
  const { session } = useAdminAuth();
  const location = useLocation();
  return session ? (
    <Outlet />
  ) : (
    <Navigate
      to="/login"
      replace
      state={{ from: location.pathname + location.search + location.hash }}
    />
  );
}
