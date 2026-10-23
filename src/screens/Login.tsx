import { useSearchParams } from 'react-router';
import { uiText } from '../content';
import { GoogleButton } from '../components/GoogleButton';
import { MenuButton } from '../components/MenuButton';
import { Screen } from '../components/Screen';
import { useLanguage } from '../lib/i18n';
import { newTexts } from '../newTexts';

/** /login. Never stands between the user and an emergency (plan rule 7.1.3). */
export default function Login() {
  const { t } = useLanguage();
  const [params] = useSearchParams();
  const error = params.get('error');

  return (
    <Screen>
      <h1 className="text-center text-[28px] font-bold">{t(newTexts.login.title)}</h1>
      <p className="text-center text-lg">{t(newTexts.login.description)}</p>

      {error && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-center text-base text-alert-red">
          {t(error === 'session' ? newTexts.login.errorSession : newTexts.login.errorGoogle)}
        </p>
      )}

      <GoogleButton returnTo={params.get('volver')} />

      <p className="mt-4 text-center text-base font-semibold">{t(newTexts.login.emergencyHint)}</p>
      <MenuButton to="/sismo" variant="red">
        {t(uiText.menu.earthquake)}
      </MenuButton>
      <MenuButton to="/emergencia" variant="blue">
        {t(uiText.menu.emergency)}
      </MenuButton>

      <MenuButton to="/">{t(newTexts.login.back)}</MenuButton>
    </Screen>
  );
}
