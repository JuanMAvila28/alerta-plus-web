import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { Button } from '../components/MenuButton';
import { Screen } from '../components/Screen';
import { apiFetch } from '../lib/api';
import { setDataConsent, signOut, useAuth } from '../lib/auth';
import { POLICY_VERSION } from '../lib/config';
import { useLanguage } from '../lib/i18n';
import { takeReturnTo } from '../lib/loginReturn';
import { syncNow } from '../lib/sync';
import { newTexts } from '../newTexts';
import { PRIVACY_URL } from './MainMenu';

/** /bienvenida: data processing authorization on first login (plan section 7.8, Law 1581 of 2012). */
export default function Welcome() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { session } = useAuth();
  const [accepted, setAccepted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  if (!session) return <Navigate to="/" replace />;
  if (session.dataConsent && !saving) return <Navigate to="/" replace />;

  const accept = async () => {
    setSaving(true);
    setError(false);
    try {
      await apiFetch('/api/consent', { method: 'POST', body: JSON.stringify({ policyVersion: POLICY_VERSION }) });
      await setDataConsent();
      // Nothing synced before the authorization: this is the first sync, the server copy wins.
      void syncNow({ preferServer: true });
      navigate(takeReturnTo(), { replace: true });
    } catch {
      setError(true);
      setSaving(false);
    }
  };

  const notNow = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  const w = newTexts.welcome;
  return (
    <Screen>
      <h1 className="text-center text-[28px] font-bold">{t(w.title)}</h1>
      <p className="text-lg">{t(w.whatWeSave)}</p>
      <p className="text-lg">{t(w.noLocation)}</p>
      <a href={PRIVACY_URL} target="_blank" rel="noopener noreferrer" className="flex min-h-12 items-center text-lg text-alert-blue underline">
        {t(w.readPolicy)}
      </a>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border-2 border-slate-300 p-3 text-base">
        <input
          type="checkbox"
          className="mt-1 size-6 shrink-0 accent-alert-blue"
          checked={accepted}
          onChange={(event) => setAccepted(event.target.checked)}
        />
        <span>{t(w.consent)}</span>
      </label>

      {error && (
        <p role="alert" className="text-center text-base text-alert-red">
          {t(w.error)}
        </p>
      )}

      <Button variant="blue" disabled={!accepted || saving} onClick={() => void accept()}>
        {t(w.accept)}
      </Button>
      <Button disabled={saving} onClick={() => void notNow()}>
        {t(w.notNow)}
      </Button>
    </Screen>
  );
}
