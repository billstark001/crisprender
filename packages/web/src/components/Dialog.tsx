import * as RadixDialog from '@radix-ui/react-dialog';
import { overlay, dialogBox, dialogCloseBtn, dialogBody } from './Dialog.css.js';
import cx from 'clsx';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  className?: string;
  classNames?: {
    overlay?: string;
    dialogBox?: string;
    dialogCloseBtn?: string;
    dialogBody?: string;
  }
  children: React.ReactNode;
}

export function Dialog({ open, onClose, className, classNames, children }: DialogProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className={cx(overlay, classNames?.overlay)} />
        <RadixDialog.Content className={cx(dialogBox, className, classNames?.dialogBox)}>
          <RadixDialog.Close className={cx(dialogCloseBtn, classNames?.dialogCloseBtn)} aria-label="Close">
            ✕
          </RadixDialog.Close>
          {children}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

export const DialogTitle = RadixDialog.Title;

export function DialogBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cx(dialogBody, className)}>{children}</div>;
}
