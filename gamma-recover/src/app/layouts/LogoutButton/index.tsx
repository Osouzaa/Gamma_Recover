import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { closeAdminSession } from '../../../services/adminSession';
import { Alert, Button } from '../../../components/ui';
export function LogoutButton() {
  const [error, setError] = useState('');
  return (
    <>
      <Button
        $variant="ghost"
        onClick={() => {
          try {
            closeAdminSession();
          } catch {
            setError(
              'Não foi possível encerrar a sessão. Verifique o armazenamento do navegador e tente novamente.',
            );
          }
        }}
      >
        <LogOut />
        Sair
      </Button>
      {error && (
        <Alert $error role="alert">
          {error}
        </Alert>
      )}
    </>
  );
}
