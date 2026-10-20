import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  adminSessionEvent,
  adminSessionKey,
  readAdminSession,
  type AdminSession,
} from '../../services/adminSession';
const Context = createContext<{ session: AdminSession | null } | null>(null);
export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState(readAdminSession);
  useEffect(() => {
    const sync = () => setSession(readAdminSession());
    const storage = (event: StorageEvent) => {
      if (event.key === adminSessionKey || event.key === null) sync();
    };
    window.addEventListener(adminSessionEvent, sync);
    window.addEventListener('storage', storage);
    window.addEventListener('focus', sync);
    return () => {
      window.removeEventListener(adminSessionEvent, sync);
      window.removeEventListener('storage', storage);
      window.removeEventListener('focus', sync);
    };
  }, []);
  useEffect(() => {
    if (!session) return;
    const timer = window.setTimeout(
      () => setSession(readAdminSession()),
      Math.max(0, session.expires - Date.now()) + 10,
    );
    return () => window.clearTimeout(timer);
  }, [session]);
  return <Context.Provider value={{ session }}>{children}</Context.Provider>;
}
export function useAdminAuth() {
  const context = useContext(Context);
  if (!context) throw new Error('Sessão administrativa indisponível.');
  return context;
}
