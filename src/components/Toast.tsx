import { X } from '@phosphor-icons/react';
import { toast, Toaster } from 'sonner';
import { useLanguage } from '../lib/i18n';
import { newTexts } from '../newTexts';

interface ToastAction {
  label: string;
  onClick: () => void;
}

/**
 * Shows a toast message. Returns a function that closes it.
 * `duration`: ms before it closes by itself; `null` = stays until closed, so it gets a close button.
 */
export function showToast(
  message: string,
  options: { duration?: number | null; action?: ToastAction } = {},
): () => void {
  const duration = options.duration === undefined ? 4000 : (options.duration ?? Infinity);
  const id = toast(message, { duration, action: options.action, closeButton: options.duration === null });
  return () => toast.dismiss(id);
}

/** Toast container. Mounted once in App. */
export function Toasts() {
  const { t } = useLanguage();

  return (
    <Toaster
      position="bottom-center"
      offset={16}
      mobileOffset={{ bottom: 'max(16px, env(safe-area-inset-bottom))', left: 16, right: 16 }}
      icons={{ close: <X size={20} weight="bold" aria-hidden="true" /> }}
      toastOptions={{
        unstyled: true,
        closeButtonAriaLabel: t(newTexts.common.close),
        classNames: {
          toast:
            'flex w-full items-center gap-2 rounded-[16px] bg-ink py-2 pr-2 pl-4 font-sans text-page shadow-[0_12px_32px_-8px_rgb(6_17_28/0.45)]',
          content: 'flex-1 py-2',
          title: 'text-label leading-snug font-semibold',
          actionButton:
            'min-h-11 shrink-0 cursor-pointer rounded-[10px] bg-page px-4 text-label font-bold tracking-[0.03em] text-ink',
          closeButton:
            'order-last flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-[10px] text-page hover:bg-page/10',
        },
      }}
    />
  );
}
