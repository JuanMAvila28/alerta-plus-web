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
      <section className="flex flex-col gap-2 rounded-xl bg-premium-card p-3">
        <p className="text-center text-base font-semibold">{t(newTexts.accountCard.invite)}</p>
        <GoogleButton />
      </section>
    );
  }

  return (
    <Link
      to="/cuenta"
      aria-label={`${t(newTexts.accountCard.myAccount)}: ${session.user.name ?? session.user.email}`}
      className="flex min-h-12 items-center gap-3 rounded-xl bg-premium-card px-3 py-2"
    >
      <Avatar user={session.user} size={36} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-semibold">{session.user.name ?? session.user.email}</span>
        <SyncStatus />
      </span>
      <span aria-hidden="true" className="text-xl text-slate-500">
        ›
      </span>
    </Link>
  );
}
