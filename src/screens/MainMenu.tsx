import { Backpack, FirstAidKit, GlobeHemisphereWest, HouseLine, ListChecks, Star, UsersThree } from '@phosphor-icons/react';
import { uiText } from '../content';
import { AccountCard } from '../components/AccountCard';
import { EmergencySigns } from '../components/EmergencySigns';
import { NavItem, NavList } from '../components/NavList';
import { Screen } from '../components/Screen';
import { withoutEmoji } from '../lib/emoji';
import { useLanguage } from '../lib/i18n';

export const PRIVACY_URL = 'https://sites.google.com/view/alerta-privacidad';

export default function MainMenu() {
  const { t } = useLanguage();
  const { menu } = uiText;
  const label = (text: (typeof menu)[keyof typeof menu]) => withoutEmoji(t(text));

  return (
    <Screen>
      <header className="flex items-center gap-3.5 pt-1 pb-1">
        <img src="/logo.svg" alt="" width={56} height={56} className="shrink-0" />
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-wordmark font-extrabold tracking-[0.01em] text-ink">{t(uiText.app.name)}</h1>
          <p className="text-caption text-ink-muted">{t(uiText.app.tagline)}</p>
        </div>
      </header>

      <AccountCard />

      <EmergencySigns />

      {/* Two groups: getting ready at home, then the rest. Spacing alone separates them. */}
      <nav className="mt-2 flex flex-col gap-3">
        <NavList>
          <NavItem to="/vivienda" icon={HouseLine}>
            {label(menu.home)}
          </NavItem>
          <NavItem to="/kit" icon={Backpack}>
            {label(menu.kit)}
          </NavItem>
          <NavItem to="/botiquin" icon={FirstAidKit}>
            {label(menu.firstAidKit)}
          </NavItem>
          <NavItem to="/checklist" icon={ListChecks}>
            {label(menu.checklist)}
          </NavItem>
        </NavList>
        <NavList>
          <NavItem to="/premium" icon={Star} tone="signal">
            {label(menu.premium)}
          </NavItem>
          <NavItem to="/nucleo" icon={UsersThree} tone="safe">
            {label(menu.contacts)}
          </NavItem>
          <NavItem to="/idioma" icon={GlobeHemisphereWest} tone="muted">
            {label(menu.language)}
          </NavItem>
        </NavList>
      </nav>

      <a
        href={PRIVACY_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="self-center px-3 py-3 text-caption text-ink-muted underline underline-offset-4 hover:text-ink"
      >
        {t(menu.privacy)}
      </a>
    </Screen>
  );
}
