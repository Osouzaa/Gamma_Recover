import { useAdminAuth } from './AdminAuth';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { storageKey } from '../../services/store';
import { useDatabase } from '../../hooks/useDatabase';
import type { Scope } from '../../services/store';
const Context = createContext<{
  creditorId: string;
  setCreditorId: (id: string) => void;
  scope: Scope;
} | null>(null);
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [creditorId, setCreditorId] = useState('');
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
        setCreditorId,
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
