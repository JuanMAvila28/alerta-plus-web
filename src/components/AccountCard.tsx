import { CaretRight, CloudArrowUp } from '@phosphor-icons/react';
import { Link } from 'react-router';
import { useAuth } from '../lib/auth';
import { useLanguage } from '../lib/i18n';
import { newTexts } from '../newTexts';
import { Avatar } from './Avatar';
import { GoogleButton } from './GoogleButton';
import { SyncStatus } from './SyncStatus';

/** Home screen card (plan section 6.3). Kept short so the emergency buttons stay above the fold. */
export function AccountCard() {
  const { t } = useLanguage();
  const { session } = useAuth();

  if (!session) {
    return (
      <section className="flex flex-col gap-3 rounded-[20px] border-2 border-line p-4">
        <p className="flex items-center gap-3 font-semibold text-ink">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-brand/12 text-brand">
            <CloudArrowUp size={22} weight="bold" aria-hidden="true" />
          </span>
          {t(newTexts.accountCard.invite)}
        </p>
        <GoogleButton />
      </section>
    );
  }

  return (
    <Link
      to="/cuenta"
      aria-label={`${t(newTexts.accountCard.myAccount)}: ${session.user.name ?? session.user.email}`}
      className="flex min-h-16 items-center gap-3.5 rounded-[20px] bg-surface py-3 pr-3 pl-4 transition-colors duration-150 hover:bg-surface-pressed active:bg-surface-pressed"
    >
      <Avatar user={session.user} size={44} />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate font-bold text-ink">{session.user.name ?? session.user.email}</span>
        <SyncStatus />
      </span>
      <CaretRight size={20} weight="bold" aria-hidden="true" className="shrink-0 text-ink-muted" />
    </Link>
  );
}
