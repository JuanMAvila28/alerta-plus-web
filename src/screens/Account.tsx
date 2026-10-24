import { DownloadSimple, SignOut, Trash } from '@phosphor-icons/react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Avatar } from '../components/Avatar';
import { ConfirmSheet } from '../components/ConfirmSheet';
import { Button, MenuButton } from '../components/MenuButton';
import { Screen, ScreenHeader } from '../components/Screen';
import { SyncStatus } from '../components/SyncStatus';
import { showToast } from '../components/Toast';
import { apiFetch } from '../lib/api';
import { clearLocalAccount, OfflineError, signOut, useAuth } from '../lib/auth';
import { usePendingCount } from '../lib/data';
import { useLanguage } from '../lib/i18n';
import { newTexts } from '../newTexts';

type Confirming = null | 'signOut' | 'delete1' | 'delete2';

const ICON = { size: 22, weight: 'bold', 'aria-hidden': true } as const;

/** /cuenta (plan section 7.8). */
export default function Account() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { session } = useAuth();
  const pending = usePendingCount();
  const [confirming, setConfirming] = useState<Confirming>(null);
  const [busy, setBusy] = useState(false);
  const a = newTexts.account;

  if (!session) return null; // RequireAccount redirects

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    try {
      await action();
    } catch (error) {
      showToast(t(error instanceof OfflineError ? a.needsConnection : a.error));
    } finally {
      setBusy(false);
    }
  };

  const download = () =>
    run(async () => {
      const blob = await (await apiFetch('/api/account/export')).blob();
      const url = URL.createObjectURL(blob);
      const link = Object.assign(document.createElement('a'), { href: url, download: 'alerta-mis-datos.json' });
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });

  // The sheet closes before the action runs: signing out or deleting unmounts this screen.
  const doSignOut = () => {
    setConfirming(null);
    return run(async () => {
      await signOut();
      navigate('/', { replace: true });
    });
  };

  const doDelete = () => {
    setConfirming(null);
    return run(async () => {
      await apiFetch('/api/account', { method: 'DELETE' });
      await clearLocalAccount();
      showToast(t(a.deleted));
      navigate('/', { replace: true });
    });
  };

  const deleting = confirming === 'delete1' || confirming === 'delete2';

  return (
    <Screen>
      <ScreenHeader title={t(a.title)} />

      <section className="flex items-center gap-4 rounded-[20px] bg-surface p-5">
        <Avatar user={session.user} size={64} />
        <div className="flex min-w-0 flex-col gap-1">
          {session.user.name && (
            <p className="font-display text-[1.625rem] leading-tight font-bold [overflow-wrap:anywhere] text-ink">
              {session.user.name}
            </p>
          )}
          <p className="text-caption [overflow-wrap:anywhere] text-ink-muted">{session.user.email}</p>
          <SyncStatus className="mt-1" />
        </div>
      </section>

      <div className="flex flex-col gap-3">
        <Button disabled={busy} onClick={() => void download()}>
          <DownloadSimple {...ICON} />
          {t(a.download)}
        </Button>
        <Button disabled={busy} onClick={() => (pending > 0 ? setConfirming('signOut') : void doSignOut())}>
          <SignOut {...ICON} />
          {t(a.signOut)}
        </Button>
      </div>

      {/* Kept apart from the everyday actions (destructive action, two confirmations). */}
      <button
        type="button"
        disabled={busy}
        className="mt-3 flex min-h-12 cursor-pointer items-center gap-2 self-center rounded-[12px] px-4 font-bold tracking-[0.03em] text-danger transition-colors hover:bg-danger/8 disabled:opacity-45"
        onClick={() => setConfirming('delete1')}
      >
        <Trash size={20} weight="bold" aria-hidden="true" />
        {t(a.delete)}
      </button>

      <MenuButton to="/" className="mt-auto">
        {t(a.back)}
      </MenuButton>

      <ConfirmSheet
        open={confirming !== null}
        busy={busy}
        onCancel={() => setConfirming(null)}
        title={t(deleting ? a.delete : a.signOut)}
        message={t(confirming === 'delete1' ? a.deleteWarning : confirming === 'delete2' ? a.deleteFinal : a.signOutPending)}
        cancelLabel={t(a.cancel)}
      >
        {deleting ? (
          <Button
            variant="red"
            disabled={busy}
            onClick={() => (confirming === 'delete1' ? setConfirming('delete2') : void doDelete())}
          >
            {t(confirming === 'delete1' ? a.deleteContinue : a.deleteConfirm)}
          </Button>
        ) : (
          <Button variant="red" disabled={busy} onClick={() => void doSignOut()}>
            {t(a.signOutConfirm)}
          </Button>
        )}
      </ConfirmSheet>
    </Screen>
  );
}
