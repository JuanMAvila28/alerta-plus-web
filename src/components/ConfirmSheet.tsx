import { Warning } from '@phosphor-icons/react';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Button } from './MenuButton';

/**
 * Bottom sheet for confirming an action that cannot be undone. A native modal <dialog>: focus stays
 * inside while it is open and starts on "cancel"; Escape and the backdrop also cancel (unless `busy`).
 */
export function ConfirmSheet({
  open,
  busy = false,
  onCancel,
  title,
  message,
  cancelLabel,
  children,
}: {
  open: boolean;
  busy?: boolean;
  onCancel: () => void;
  title: string;
  message: string;
  cancelLabel: string;
  /** The confirm button. */
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const messageId = useId();

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) {
      element.showModal();
      cancel.current?.focus();
    }
    if (!open && element.open) element.close();
  }, [open]);

  const dismiss = () => !busy && onCancel();

  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      aria-describedby={messageId}
      onCancel={(event) => {
        event.preventDefault();
        dismiss();
      }}
      // A click on the dialog element itself is a click on the backdrop: the content covers the rest.
      onClick={(event) => event.target === event.currentTarget && dismiss()}
      className="fixed inset-x-0 top-auto bottom-0 m-0 mx-auto w-full max-w-md bg-transparent p-0 text-ink backdrop:bg-[rgb(6_17_28/0.55)] open:motion-safe:animate-[sheet-in_320ms_var(--ease-out-quart)] backdrop:motion-safe:animate-[fade_200ms_ease-out]"
    >
      <div className="flex max-h-[90dvh] flex-col gap-4 overflow-y-auto rounded-t-[28px] bg-raised px-6 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div aria-hidden="true" className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-line" />
        <span className="flex size-12 items-center justify-center rounded-[14px] bg-danger/12 text-danger">
          <Warning size={26} weight="bold" aria-hidden="true" />
        </span>
        <h2 id={titleId} className="font-display text-[1.875rem] leading-none font-bold">
          {title}
        </h2>
        {/* The key replays the fade when the message changes between the two delete steps. */}
        <p key={message} id={messageId} className="motion-safe:animate-[fade-in_200ms_ease-out]">
          {message}
        </p>
        <div className="mt-2 flex flex-col gap-3">
          {children}
          <Button ref={cancel} onClick={onCancel}>
            {cancelLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
