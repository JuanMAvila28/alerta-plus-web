import { useEffect, useSyncExternalStore } from 'react';
import { useLanguage } from '../lib/i18n';
import { newTexts } from '../newTexts';

export interface ToastData {
  id: number;
  message: string;
  /** ms before it closes by itself; `null` = stays until closed. */
  duration: number | null;
  action?: { label: string; onClick: () => void };
}

let toasts: ToastData[] = [];
let nextId = 1;
const subscribers = new Set<() => void>();

function emit(next: ToastData[]) {
  toasts = next;
  subscribers.forEach((notify) => notify());
}

/** Shows a toast message. Returns a function that closes it. */
export function showToast(
  message: string,
  options: { duration?: number | null; action?: ToastData['action'] } = {},
): () => void {
  const id = nextId++;
  emit([...toasts, { id, message, duration: options.duration === undefined ? 4000 : options.duration, action: options.action }]);
  return () => closeToast(id);
}

export function closeToast(id: number) {
  emit(toasts.filter((toast) => toast.id !== id));
}

function subscribe(notify: () => void) {
  subscribers.add(notify);
  return () => subscribers.delete(notify);
}

function ToastItem({ toast }: { toast: ToastData }) {
  const { t } = useLanguage();

  useEffect(() => {
    if (toast.duration === null) return;
    const timer = setTimeout(() => closeToast(toast.id), toast.duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration]);

  return (
    <div className="pointer-events-auto flex items-center gap-3 rounded-xl bg-slate-900 px-4 py-3 text-base text-white shadow-lg">
      <p className="flex-1">{toast.message}</p>
      {toast.action && (
        <button
          type="button"
          className="min-h-12 rounded-lg bg-white px-4 font-bold text-slate-900"
          onClick={() => {
            toast.action?.onClick();
            closeToast(toast.id);
          }}
        >
          {toast.action.label}
        </button>
      )}
      <button
        type="button"
        aria-label={t(newTexts.common.close)}
        className="min-h-12 min-w-12 rounded-lg text-xl"
        onClick={() => closeToast(toast.id)}
      >
        ✕
      </button>
    </div>
  );
}

/** Toast container. Mounted once in App. */
export function Toasts() {
  const list = useSyncExternalStore(subscribe, () => toasts);
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 mx-auto flex max-w-md flex-col gap-2 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
    >
      {list.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
