import { BookOpenText, Brain } from '@phosphor-icons/react';
import { premiumContent, protocolsContent } from '../content';
import { MenuButton } from '../components/MenuButton';
import { NavItem, NavList } from '../components/NavList';
import { protocolIcon } from '../components/protocolIcons';
import { HeaderIcon, Screen, ScreenHeader } from '../components/Screen';
import { withoutEmoji } from '../lib/emoji';
import { useLanguage } from '../lib/i18n';

/** /premium/guias (plan section 6.11). */
export default function LibraryScreen() {
  const { t } = useLanguage();
  const { library } = premiumContent;
  return (
    <Screen>
      <ScreenHeader
        title={withoutEmoji(t(library.title))}
        subtitle={t(library.subtitle)}
        icon={
          <HeaderIcon className="bg-signal/15 text-signal">
            <BookOpenText size={28} weight="bold" aria-hidden="true" />
          </HeaderIcon>
        }
      >
        {t(library.description)}
      </ScreenHeader>
      <nav>
        <NavList>
          {library.guides.map((guide, index) => (
            // The guides follow the order of the protocols (checked in content.test.ts), so they share icons.
            <NavItem
              key={guide.title.es}
              to={`/premium/guias/${index}`}
              icon={protocolIcon(protocolsContent.protocols[index]?.id)}
              tone="danger"
            >
              {t(guide.title)}
            </NavItem>
          ))}
        </NavList>
      </nav>
      <MenuButton to="/premium/practica" variant="blue">
        <Brain size={20} weight="bold" aria-hidden="true" />
        {withoutEmoji(t(library.practiceButton))}
      </MenuButton>
      <MenuButton to="/premium">{t(premiumContent.practice.backButton)}</MenuButton>
    </Screen>
  );
}
