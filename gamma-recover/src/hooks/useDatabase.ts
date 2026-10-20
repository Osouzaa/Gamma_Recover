import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { demoAdapter } from '../services/store';
export function useDatabase() {
  const query = useQuery({
    queryKey: ['database'],
    queryFn: () => demoAdapter.read(),
    staleTime: Infinity,
  });
  return { ...query, data: query.isError ? undefined : query.data };
}
export function useAction() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (action: () => unknown) => action(),
    onSuccess: () => client.invalidateQueries({ queryKey: ['database'] }),
  });
}
