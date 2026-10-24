import { ArrowsClockwise, CloudArrowUp, CloudCheck, CloudSlash, Warning, type Icon } from '@phosphor-icons/react';
import { useAuth } from '../lib/auth';
import { usePendingCount } from '../lib/data';
import { useLanguage } from '../lib/i18n';
import { useSyncState } from '../lib/sync';
import { newTexts } from '../newTexts';

type State = keyof typeof newTexts.sync;

const ICONS: Record<State, Icon> = {
  synced: CloudCheck,
  syncing: ArrowsClockwise,
  pending: CloudArrowUp,
  offline: CloudSlash,
  expired: Warning,
};

/** "Synced / pending / offline" (plan section 7.6). The icon repeats the state so it never depends on color. */
export function SyncStatus({ className = '' }: { className?: string }) {
  const { t } = useLanguage();
  const { expired } = useAuth();
  const { running, offline } = useSyncState();
  const pending = usePendingCount();

  const state: State = expired ? 'expired' : offline ? 'offline' : running ? 'syncing' : pending > 0 ? 'pending' : 'synced';
  const color =
    expired || (offline && pending > 0) ? 'text-warn' : state === 'synced' ? 'text-safe' : 'text-ink-muted';
  const StatusIcon = ICONS[state];

  return (
    <p role="status" className={`flex items-start gap-1.5 text-caption ${color} ${className}`}>
      <StatusIcon
        size={18}
        weight="bold"
        aria-hidden="true"
        className={`mt-px shrink-0 ${state === 'syncing' ? 'motion-safe:animate-[spin_1.2s_linear_infinite]' : ''}`}
      />
      <span>{t(newTexts.sync[state])}</span>
    </p>
  );
}
