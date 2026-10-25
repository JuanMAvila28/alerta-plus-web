import { ArrowUUpLeft } from '@phosphor-icons/react';
import { Navigate, useParams } from 'react-router';
import { protocolsContent, uiText } from '../content';
import { MenuButton } from '../components/MenuButton';
import { protocolIcon } from '../components/protocolIcons';
import { ReaderControls } from '../components/ReaderControls';
import { HeaderIcon, Screen, ScreenHeader, StepProgress } from '../components/Screen';
import { withoutEmoji } from '../lib/emoji';
import { useLanguage } from '../lib/i18n';
import { useStepReader } from '../lib/useStepReader';
import { useWakeLock } from '../lib/wakeLock';
import type { Protocol } from '../types';

/** /emergencia/:id (plan section 6.6). */
export default function ProtocolScreen() {
  const { id } = useParams();
  const protocol = protocolsContent.protocols.find((p) => p.id === id);
  if (!protocol) return <Navigate to="/emergencia" replace />;
  // `key`: switching protocols starts again from step 1.
  return <ProtocolReader key={protocol.id} protocol={protocol} />;
}

function ProtocolReader({ protocol }: { protocol: Protocol }) {
  const { language, t } = useLanguage();
  const total = protocol.steps.length;
  const reader = useStepReader({
    total,
    textFor: (i) => t(protocol.steps[i]!),
    language,
  });
  const { index, isLast } = reader;
  useWakeLock(true);
  const ProtocolIcon = protocolIcon(protocol.id);

  return (
    <Screen>
      <ScreenHeader
        title={withoutEmoji(t(protocol.title))}
        icon={
          <HeaderIcon className="bg-alert-red text-white">
            <ProtocolIcon size={28} weight="bold" aria-hidden="true" />
          </HeaderIcon>
        }
      />
      <StepProgress label={t(uiText.protocol.counter, { current: index + 1, total })} current={index} total={total} />
      {/* Fixed minimum height: the buttons below stay put while the steps change. */}
      <p
        aria-live="polite"
        className="flex min-h-44 items-center rounded-[20px] bg-surface p-5 text-[1.375rem] leading-normal font-semibold text-ink"
      >
        {t(protocol.steps[index]!)}
      </p>

      <ReaderControls reader={reader} />
      {isLast && (
        <MenuButton to="/emergencia" variant="blue">
          <ArrowUUpLeft size={20} weight="bold" aria-hidden="true" />
          {withoutEmoji(t(uiText.protocol.backToEmergencies))}
        </MenuButton>
      )}
      <MenuButton to="/emergencia">{t(uiText.protocol.exit)}</MenuButton>
    </Screen>
  );
}
