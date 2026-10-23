import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Avatar } from '../components/Avatar';
import { Button, MenuButton } from '../components/MenuButton';
import { Screen } from '../components/Screen';
import { SyncStatus } from '../components/SyncStatus';
import { showToast } from '../components/Toast';
import { apiFetch } from '../lib/api';
import { clearLocalAccount, OfflineError, signOut, useAuth } from '../lib/auth';
import { usePendingCount } from '../lib/data';
import { useLanguage } from '../lib/i18n';
import { newTexts } from '../newTexts';

type Confirming = null | 'signOut' | 'delete1' | 'delete2';

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

  const doSignOut = () =>
    run(async () => {
      await signOut();
      navigate('/', { replace: true });
    });

  const doDelete = () =>
    run(async () => {
      await apiFetch('/api/account', { method: 'DELETE' });
      await clearLocalAccount();
      showToast(t(a.deleted));
      navigate('/', { replace: true });
    });

  return (
    <Screen>
      <h1 className="text-center text-[28px] font-bold">{t(a.title)}</h1>

      <section className="flex items-center gap-4 rounded-xl bg-premium-card p-4">
        <Avatar user={session.user} size={56} />
        <div className="min-w-0">
          {session.user.name && <p className="truncate text-lg font-bold">{session.user.name}</p>}
          <p className="truncate text-base text-slate-700">{session.user.email}</p>
          <SyncStatus className="mt-1" />
        </div>
      </section>

      <Button disabled={busy} onClick={() => void download()}>
        {t(a.download)}
      </Button>

      {confirming === 'signOut' ? (
        <section className="flex flex-col gap-3 rounded-xl border-2 border-amber-600 p-4">
          <p className="text-base">{t(a.signOutPending)}</p>
          <Button variant="red" disabled={busy} onClick={() => void doSignOut()}>
            {t(a.signOutConfirm)}
          </Button>
          <Button onClick={() => setConfirming(null)}>{t(a.cancel)}</Button>
        </section>
      ) : (
        <Button
          disabled={busy}
          onClick={() => (pending > 0 ? setConfirming('signOut') : void doSignOut())}
        >
          {t(a.signOut)}
        </Button>
      )}

      {confirming === 'delete1' || confirming === 'delete2' ? (
        <section className="flex flex-col gap-3 rounded-xl border-2 border-alert-red p-4">
          <p className="text-base">{t(confirming === 'delete1' ? a.deleteWarning : a.deleteFinal)}</p>
          <Button
            variant="red"
            disabled={busy}
            onClick={() => (confirming === 'delete1' ? setConfirming('delete2') : void doDelete())}
          >
            {t(confirming === 'delete1' ? a.deleteContinue : a.deleteConfirm)}
          </Button>
          <Button onClick={() => setConfirming(null)}>{t(a.cancel)}</Button>
        </section>
      ) : (
        <button
          type="button"
          disabled={busy}
          className="min-h-12 self-center px-4 text-base font-bold text-alert-red underline disabled:opacity-50"
          onClick={() => setConfirming('delete1')}
        >
          {t(a.delete)}
        </button>
      )}

      <MenuButton to="/">{t(a.back)}</MenuButton>
    </Screen>
  );
}
