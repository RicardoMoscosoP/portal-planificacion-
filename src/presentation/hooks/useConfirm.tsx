import { useCallback, useState } from 'react';
import ConfirmDialog from '../components/ConfirmDialog';

type Options = {
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
};

export function useConfirm() {
  const [pending, setPending] = useState<{
    message: string;
    options: Options;
    resolve: (value: boolean) => void;
  } | null>(null);

  const confirm = useCallback((message: string, options: Options = {}) => {
    return new Promise<boolean>(resolve => {
      setPending({ message, options, resolve });
    });
  }, []);

  const handleClose = useCallback((value: boolean) => {
    pending?.resolve(value);
    setPending(null);
  }, [pending]);

  const dialog = pending ? (
    <ConfirmDialog
      message={pending.message}
      title={pending.options.title}
      confirmLabel={pending.options.confirmLabel}
      cancelLabel={pending.options.cancelLabel}
      danger={pending.options.danger}
      onConfirm={() => handleClose(true)}
      onCancel={() => handleClose(false)}
    />
  ) : null;

  return { confirm, dialog };
}
