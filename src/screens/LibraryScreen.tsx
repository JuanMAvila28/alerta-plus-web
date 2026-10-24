import { premiumContent } from '../content';
import { MenuButton } from '../components/MenuButton';
import { Screen } from '../components/Screen';
import { useLanguage } from '../lib/i18n';

/** /premium/guias (plan section 6.11). */
export default function LibraryScreen() {
  const { t } = useLanguage();
  const { library } = premiumContent;
  return (
    <Screen>
      <h1 className="text-center text-[28px] font-bold">{t(library.title)}</h1>
      <h2 className="text-center text-xl font-bold text-alert-blue">{t(library.subtitle)}</h2>
      <p className="text-center text-lg">{t(library.description)}</p>
      <nav className="flex flex-col gap-3">
        {library.guides.map((guide, index) => (
          <MenuButton key={guide.title.es} to={`/premium/guias/${index}`}>
            {t(guide.title)}
          </MenuButton>
        ))}
      </nav>
      <MenuButton to="/premium/practica" variant="blue">
        {t(library.practiceButton)}
      </MenuButton>
      <MenuButton to="/premium">{t(premiumContent.practice.backButton)}</MenuButton>
    </Screen>
  );
}
