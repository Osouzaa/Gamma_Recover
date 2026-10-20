import { useState } from 'react';
import { Alert, Button, Empty } from '../ui';
import { ResetDemoDialog } from '../ResetDemoDialog';
export function Feedback({ error, success }: { error?: unknown; success?: string }) {
  return (
    <>
      {error && (
        <Alert $error role="alert">
          {error instanceof Error
            ? error.message
            : 'Não foi possível concluir. Revise os dados e tente novamente.'}
        </Alert>
      )}
      {success && <Alert role="status">{success}</Alert>}
    </>
  );
}
export function LoadingState() {
  return <Empty role="status">Carregando dados demonstrativos…</Empty>;
}
export function ErrorState({ retry }: { retry: () => void }) {
  const [reset, setReset] = useState(false);
  return (
    <>
      <Empty>
        <h2>Não foi possível carregar os dados.</h2>
        <p>Verifique o armazenamento local do navegador e tente novamente.</p>
        <Button onClick={retry}>Tentar novamente</Button>{' '}
        <Button onClick={() => setReset(true)}>Restaurar demonstração</Button>
      </Empty>
      {reset && <ResetDemoDialog onClose={() => setReset(false)} />}
    </>
  );
}
