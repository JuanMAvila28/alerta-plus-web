import { protocolsContent, uiText } from '../content';
import { MenuButton } from '../components/MenuButton';
import { Screen } from '../components/Screen';
import { useLanguage } from '../lib/i18n';

/** /emergencia: no account, no connection needed (plan rule 7.1.1). */
export default function EmergencyMenu() {
  const { t } = useLanguage();
  return (
    <Screen>
      <h1 className="text-center text-[28px] font-bold text-alert-red">{t(uiText.emergency.title)}</h1>
      <p className="text-center text-lg">{t(uiText.emergency.question)}</p>
      <nav className="flex flex-col gap-3">
        {protocolsContent.protocols.map((protocol) => (
          <MenuButton key={protocol.id} to={`/emergencia/${protocol.id}`}>
            {t(protocol.menuButton)}
          </MenuButton>
        ))}
      </nav>
      <MenuButton to="/">{t(uiText.emergency.back)}</MenuButton>
    </Screen>
  );
}
