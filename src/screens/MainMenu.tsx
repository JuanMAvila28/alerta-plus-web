import { uiText } from '../content';
import { AccountCard } from '../components/AccountCard';
import { MenuButton } from '../components/MenuButton';
import { Screen } from '../components/Screen';
import { useLanguage } from '../lib/i18n';

export const PRIVACY_URL = 'https://sites.google.com/view/alerta-privacidad';

export default function MainMenu() {
  const { t } = useLanguage();
  const { menu } = uiText;

  return (
    <Screen>
      <header className="text-center">
        <h1 className="text-[38px] font-bold leading-tight">{t(uiText.app.name)}</h1>
        <p className="text-lg text-slate-700">{t(uiText.app.tagline)}</p>
      </header>

      <AccountCard />

      <MenuButton to="/sismo" variant="red">
        {t(menu.earthquake)}
      </MenuButton>
      <MenuButton to="/emergencia" variant="blue">
        {t(menu.emergency)}
      </MenuButton>

      <nav className="mt-2 flex flex-col gap-3">
        <MenuButton to="/vivienda">{t(menu.home)}</MenuButton>
        <MenuButton to="/kit">{t(menu.kit)}</MenuButton>
        <MenuButton to="/botiquin">{t(menu.firstAidKit)}</MenuButton>
        <MenuButton to="/checklist">{t(menu.checklist)}</MenuButton>
        <MenuButton to="/premium">{t(menu.premium)}</MenuButton>
        <MenuButton to="/nucleo">{t(menu.contacts)}</MenuButton>
        <MenuButton to="/idioma">{t(menu.language)}</MenuButton>
      </nav>

      <a
        href={PRIVACY_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 self-center py-3 text-alert-blue underline"
      >
        {t(menu.privacy)}
      </a>
    </Screen>
  );
}
