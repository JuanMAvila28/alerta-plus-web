// Temporary: routes from later phases.
import { MenuButton } from '../components/MenuButton';
import { Screen, ScreenHeader } from '../components/Screen';
import { useLanguage } from '../lib/i18n';
import { newTexts } from '../newTexts';

export default function UnderConstruction() {
  const { t } = useLanguage();
  return (
    <Screen>
      {/* Barrier tape, the street sign for "work in progress". */}
      <div
        aria-hidden="true"
        className="mt-3 h-4 rounded-full bg-[repeating-linear-gradient(-45deg,#f5c400_0_14px,#102a43_14px_28px)]"
      />
      <ScreenHeader title={t(newTexts.underConstruction.title)} />
      <MenuButton to="/" className="mt-auto">
        {t(newTexts.underConstruction.back)}
      </MenuButton>
    </Screen>
  );
}
