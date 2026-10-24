import { Check, ShieldCheck } from '@phosphor-icons/react';
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { Button } from '../components/MenuButton';
import { Screen, ScreenHeader } from '../components/Screen';
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
      <ScreenHeader title={t(w.title)}>{t(w.whatWeSave)}</ScreenHeader>

      <p className="flex items-start gap-3 rounded-[16px] bg-safe/10 p-4 font-semibold text-ink">
        <ShieldCheck size={24} weight="bold" aria-hidden="true" className="shrink-0 text-safe" />
        {t(w.noLocation)}
      </p>

      <a
        href={PRIVACY_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="self-start py-1 font-semibold text-link underline underline-offset-4"
      >
        {t(w.readPolicy)}
      </a>

      <label className="mt-2 flex cursor-pointer items-start gap-4 rounded-[18px] border-2 border-line p-4 transition-colors duration-150 has-checked:border-alert-blue has-checked:bg-alert-blue/6">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={accepted}
          onChange={(event) => setAccepted(event.target.checked)}
        />
        <span
          aria-hidden="true"
          className="flex size-7 shrink-0 items-center justify-center rounded-[8px] border-2 border-ink/40 bg-page text-white transition-colors duration-150 peer-checked:border-alert-blue peer-checked:bg-alert-blue peer-focus-visible:outline-3 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-focus [&>svg]:scale-50 [&>svg]:opacity-0 [&>svg]:transition-[opacity,scale] [&>svg]:duration-150 peer-checked:[&>svg]:scale-100 peer-checked:[&>svg]:opacity-100"
        >
          <Check size={18} weight="bold" />
        </span>
        <span className="text-ink">{t(w.consent)}</span>
      </label>

      {error && (
        <p role="alert" className="text-danger">
          {t(w.error)}
        </p>
      )}

      <div className="mt-auto flex flex-col gap-3 pt-2">
        <Button variant="blue" disabled={!accepted || saving} onClick={() => void accept()}>
          {t(w.accept)}
        </Button>
        <Button disabled={saving} onClick={() => void notNow()}>
          {t(w.notNow)}
        </Button>
      </div>
    </Screen>
  );
}
