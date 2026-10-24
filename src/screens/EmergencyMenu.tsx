import {
  Ambulance,
  Bandaids,
  Bone,
  Bug,
  EyeClosed,
  Fire,
  ForkKnife,
  HandFist,
  Lightning,
  Pulse,
  Skull,
  Waves,
  Wind,
  type Icon,
} from '@phosphor-icons/react';
import { Link } from 'react-router';
import { protocolsContent, uiText } from '../content';
import { MenuButton } from '../components/MenuButton';
import { Screen, ScreenHeader } from '../components/Screen';
import { withoutEmoji } from '../lib/emoji';
import { useLanguage } from '../lib/i18n';

// One icon per protocol id: the approved texts keep their emoji, the screen draws these instead.
const ICONS: Record<string, Icon> = {
  herida: Bandaids,
  fractura: Bone,
  quemadura: Fire,
  electrocucion: Lightning,
  desmayo: EyeClosed,
  obstruccion: ForkKnife,
  golpe_trauma: HandFist,
  mordedura_picadura: Bug,
  ahogamiento: Waves,
  convulsion: Pulse,
  intoxicacion: Skull,
  dificultad_respirar: Wind,
  otra_emergencia: Ambulance,
};

/** The catch-all goes last and full width, so the 12 specific cases pair up without a gap. */
const GENERAL_ID = 'otra_emergencia';

/** /emergencia: no account, no connection needed (plan rule 7.1.1). */
export default function EmergencyMenu() {
  const { t } = useLanguage();
  return (
    <Screen>
      <ScreenHeader title={t(uiText.emergency.title)}>{t(uiText.emergency.question)}</ScreenHeader>
      <nav className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2">
        {protocolsContent.protocols.map((protocol) => {
          const ProtocolIcon = ICONS[protocol.id] ?? Ambulance;
          const general = protocol.id === GENERAL_ID;
          return (
            <Link
              key={protocol.id}
              to={`/emergencia/${protocol.id}`}
              className={`flex cursor-pointer rounded-[18px] transition-[background-color,scale] duration-150 ease-out-quart active:scale-[0.98] ${
                general
                  ? 'min-h-16 items-center gap-4 border-2 border-line px-4 hover:bg-surface active:bg-surface-pressed min-[360px]:col-span-2'
                  : 'min-h-32 min-w-0 flex-col justify-between gap-4 bg-surface p-3.5 hover:bg-surface-pressed active:bg-surface-pressed max-[359px]:min-h-20 max-[359px]:flex-row max-[359px]:items-center max-[359px]:justify-start'
              }`}
            >
              <span
                className={`flex shrink-0 items-center justify-center rounded-[12px] ${
                  general ? 'size-10 bg-alert-blue text-white' : 'size-12 bg-alert-red text-white'
                }`}
              >
                <ProtocolIcon size={general ? 22 : 28} weight="bold" aria-hidden="true" />
              </span>
              <span className="font-display text-[1.1875rem] leading-[1.05] font-bold tracking-[0.01em] text-ink [overflow-wrap:anywhere]">
                {withoutEmoji(t(protocol.menuButton))}
              </span>
            </Link>
          );
        })}
      </nav>
      <MenuButton to="/" className="mt-2">
        {t(uiText.emergency.back)}
      </MenuButton>
    </Screen>
  );
}
