import { WarningCircle } from '@phosphor-icons/react';
import { useSearchParams } from 'react-router';
import { EmergencySigns } from '../components/EmergencySigns';
import { GoogleButton } from '../components/GoogleButton';
import { MenuButton } from '../components/MenuButton';
import { Screen, ScreenHeader } from '../components/Screen';
import { useLanguage } from '../lib/i18n';
import { newTexts } from '../newTexts';

/** /login. Never stands between the user and an emergency (plan rule 7.1.3). */
export default function Login() {
  const { t } = useLanguage();
  const [params] = useSearchParams();
  const error = params.get('error');

  return (
    <Screen>
      <ScreenHeader title={t(newTexts.login.title)}>{t(newTexts.login.description)}</ScreenHeader>

      {error && (
        <p role="alert" className="flex items-start gap-3 rounded-[16px] bg-danger/10 p-4 text-danger">
          <WarningCircle size={22} weight="bold" aria-hidden="true" className="mt-0.5 shrink-0" />
          {t(error === 'session' ? newTexts.login.errorSession : newTexts.login.errorGoogle)}
        </p>
      )}

      <div className="rounded-[20px] bg-surface px-4 py-5">
        <GoogleButton returnTo={params.get('volver')} />
      </div>

      <section className="mt-4 flex flex-col gap-3 border-t-2 border-line pt-5">
        <p className="font-semibold text-ink">{t(newTexts.login.emergencyHint)}</p>
        <EmergencySigns compact />
      </section>

      <MenuButton to="/" className="mt-auto">
        {t(newTexts.login.back)}
      </MenuButton>
    </Screen>
  );
}
