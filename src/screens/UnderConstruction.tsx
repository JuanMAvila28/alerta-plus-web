// Temporary: routes from later phases.
import { MenuButton } from '../components/MenuButton';
import { Screen } from '../components/Screen';
import { useLanguage } from '../lib/i18n';
import { newTexts } from '../newTexts';

export default function UnderConstruction() {
  const { t } = useLanguage();
  return (
    <Screen>
      <h1 className="text-center text-[26px] font-bold">{t(newTexts.underConstruction.title)}</h1>
      <MenuButton to="/">{t(newTexts.underConstruction.back)}</MenuButton>
    </Screen>
  );
}
