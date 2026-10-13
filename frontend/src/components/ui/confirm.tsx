import { createContext, useContext, useState, type ReactNode } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './dialog';
import { Button } from './Button';

export type ConfirmOptions = {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
};

type ConfirmFn = (opts: ConfirmOptions | string) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn>(() => Promise.resolve(false));

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ opts: ConfirmOptions; resolve: (v: boolean) => void } | null>(null);

  const confirm: ConfirmFn = (opts) => {
    const normalized: ConfirmOptions = typeof opts === 'string' ? { message: opts } : opts;
    return new Promise<boolean>((resolve) => setState({ opts: normalized, resolve }));
  };

  const close = (value: boolean) => {
    state?.resolve(value);
    setState(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog open={!!state} onOpenChange={(open) => { if (!open) close(false); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{state?.opts.title || 'Confirmar'}</DialogTitle>
            <DialogDescription>{state?.opts.message}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-2">
            <Button
              onClick={() => close(false)}
              className="border border-gray-200 dark:border-dark-600 text-gray-600 dark:text-dark-300 hover:bg-gray-50 dark:hover:bg-dark-700"
            >
              {state?.opts.cancelText || 'No'}
            </Button>
            <Button
              onClick={() => close(true)}
              className={state?.opts.danger === false
                ? 'bg-primary-600 text-white hover:bg-primary-700'
                : 'bg-red-600 text-white hover:bg-red-700'}
            >
              {state?.opts.confirmText || 'Sí'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  return useContext(ConfirmContext);
}
