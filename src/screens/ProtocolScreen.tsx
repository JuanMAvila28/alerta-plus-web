import { Navigate, useParams } from 'react-router';
import { protocolsContent, uiText } from '../content';
import { MenuButton } from '../components/MenuButton';
import { ReaderControls } from '../components/ReaderControls';
import { Screen } from '../components/Screen';
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
  const { index, mode, start, next, isLast } = useStepReader({
    total,
    textFor: (i) => t(protocol.steps[i]!),
    language,
  });
  useWakeLock(true);

  return (
    <Screen>
      <h1 className="text-center text-[26px] font-bold">{t(protocol.title)}</h1>
      <p className="text-center text-[22px] font-bold text-alert-blue">
        {t(uiText.protocol.counter, { current: index + 1, total })}
      </p>
      <p aria-live="polite" className="flex min-h-40 items-center justify-center text-center text-xl leading-relaxed">
        {t(protocol.steps[index]!)}
      </p>

      <ReaderControls mode={mode} isLast={isLast} onStart={start} onNext={next} />
      {isLast && (
        <MenuButton to="/emergencia" variant="blue">
          {t(uiText.protocol.backToEmergencies)}
        </MenuButton>
      )}
      <MenuButton to="/emergencia">{t(uiText.protocol.exit)}</MenuButton>
    </Screen>
  );
}
