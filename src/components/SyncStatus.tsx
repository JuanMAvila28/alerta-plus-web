import { useAuth } from '../lib/auth';
import { usePendingCount } from '../lib/data';
import { useLanguage } from '../lib/i18n';
import { useSyncState } from '../lib/sync';
import { newTexts } from '../newTexts';

/** "Synced / pending / offline" (plan section 7.6). */
export function SyncStatus({ className = '' }: { className?: string }) {
  const { t } = useLanguage();
  const { expired } = useAuth();
  const { running, offline } = useSyncState();
  const pending = usePendingCount();

  const text = expired
    ? newTexts.sync.expired
    : offline
      ? newTexts.sync.offline
      : running
        ? newTexts.sync.syncing
        : pending > 0
          ? newTexts.sync.pending
          : newTexts.sync.synced;
  const color = expired || (offline && pending > 0) ? 'text-amber-800' : 'text-slate-600';

  return (
    <p role="status" className={`text-sm ${color} ${className}`}>
      {t(text)}
    </p>
  );
}
