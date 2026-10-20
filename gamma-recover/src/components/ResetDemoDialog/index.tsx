import { useAction } from '../../hooks/useDatabase';
import { demoAdapter } from '../../services/store';
import { Modal } from '../Modal';
import { Alert, Button, Stack } from '../ui';
export function ResetDemoDialog({
  onClose,
  onReset,
}: {
  onClose: () => void;
  onReset?: () => void;
}) {
  const action = useAction();
  return (
    <Modal title="Restaurar demonstração?" onClose={onClose}>
      <Stack>
        <Alert $error>
          Esta ação substitui todos os cadastros e alterações locais pelo cenário fictício inicial.
        </Alert>
        <Button
          $variant="danger"
          disabled={action.isPending}
          onClick={() =>
            action.mutate(() => demoAdapter.reset(), {
              onSuccess: () => {
                onReset?.();
                onClose();
              },
            })
          }
        >
          Confirmar restauração
        </Button>
        {action.error && (
          <Alert $error role="alert">
            {action.error.message}
          </Alert>
        )}
      </Stack>
    </Modal>
  );
}
