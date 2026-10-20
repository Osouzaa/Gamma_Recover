import { useAdminAuth } from './AdminAuth';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { storageKey } from '../../services/store';
import { useDatabase } from '../../hooks/useDatabase';
import type { Scope } from '../../services/store';
const Context = createContext<{
  creditorId: string;
  setCreditorId: (id: string) => void;
  guardCreditorChange: (guard: () => boolean) => () => void;
  scope: Scope;
} | null>(null);
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [creditorId, setCreditorId] = useState('');
  const creditorGuard = useRef<(() => boolean) | null>(null);
  const guardCreditorChange = useCallback((guard: () => boolean) => {
    creditorGuard.current = guard;
    return () => {
      if (creditorGuard.current === guard) creditorGuard.current = null;
    };
  }, []);
  const { session } = useAdminAuth();
  useEffect(() => setCreditorId(''), [session?.email]);
  const { data } = useDatabase();
  const client = useQueryClient();
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const channel = new BroadcastChannel(storageKey);
    channel.onmessage = () => {
      void client.invalidateQueries({ queryKey: ['database'] });
    };
    return () => channel.close();
  }, [client]);
  return (
    <Context.Provider
      value={{
        creditorId,
        setCreditorId: (id) => {
          if (id === creditorId || !creditorGuard.current || creditorGuard.current())
            setCreditorId(id);
        },
        guardCreditorChange,
        scope: { creditorId, role: data?.settings.role || 'Administrador' },
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useWorkspace() {
  const ctx = useContext(Context);
  if (!ctx) throw new Error('Contexto indisponível.');
  return ctx;
}
