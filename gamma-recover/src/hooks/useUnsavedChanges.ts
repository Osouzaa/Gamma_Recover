import { useEffect } from 'react';
import { useBeforeUnload, useBlocker } from 'react-router-dom';
import { useWorkspace } from '../app/providers/Context';

export function useUnsavedChanges(dirty: boolean, message: string) {
  const { guardCreditorChange } = useWorkspace();
  useEffect(
    () => guardCreditorChange(() => !dirty || window.confirm(message)),
    [dirty, guardCreditorChange, message],
  );
  const blocker = useBlocker(dirty);
  useEffect(() => {
    if (blocker.state !== 'blocked') return;
    if (window.confirm(message)) blocker.proceed();
    else blocker.reset();
  }, [blocker, message]);
  useBeforeUnload((event) => {
    if (dirty) {
      event.preventDefault();
      event.returnValue = '';
    }
  });
}
