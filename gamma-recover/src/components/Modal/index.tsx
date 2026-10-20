import { useEffect, useRef, type ReactNode } from 'react';
import { Dialog } from './styles';
import { X } from 'lucide-react';
import { Button, PanelBody, PanelHeader } from '../ui';
export function Modal({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const dialog = ref.current;
    dialog?.showModal();
    return () => {
      dialog?.close();
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  return (
    <Dialog
      $wide={wide}
      ref={ref}
      aria-label={title}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <PanelHeader>
        <h2>{title}</h2>
        <Button aria-label="Fechar" onClick={onClose}>
          <X />
        </Button>
      </PanelHeader>
      <PanelBody>{children}</PanelBody>
    </Dialog>
  );
}
