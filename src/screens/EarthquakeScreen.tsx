import { earthquakeContent, uiText } from '../content';
import { MenuButton } from '../components/MenuButton';
import { EarthquakePictogram } from '../components/Pictogram';
import { ReaderControls } from '../components/ReaderControls';
import { HeaderIcon, Screen, ScreenHeader, StepProgress } from '../components/Screen';
import { defaultContent, useDocument } from '../lib/data';
import { earthquakeSteps, visibleInstructions } from '../lib/earthquake';
import { useLanguage } from '../lib/i18n';
import { useStepReader } from '../lib/useStepReader';
import { useWakeLock } from '../lib/wakeLock';
import type { Home } from '../types';

/** Adds ". " unless the sentence already ends in punctuation. */
const sentence = (text: string) => (/[.!?]$/.test(text.trim()) ? text.trim() : `${text.trim()}.`);

/** /sismo (plan section 6.4). Without an account or a saved home, the default home is used. */
export default function EarthquakeScreen() {
  const saved = useDocument('home');
  // Do not wait for storage to show the first step: start with the defaults.
  return <EarthquakeReader home={saved ?? defaultContent('home')} />;
}

function EarthquakeReader({ home }: { home: Home }) {
  const { language, t } = useLanguage();
  const total = earthquakeSteps.length;
  const reader = useStepReader({
    total,
    // Title + each visible instruction (plan section 6.4).
    textFor: (i) => {
      const step = earthquakeSteps[i]!;
      return [step.title, ...visibleInstructions(step, home).map((instruction) => instruction.text)]
        .map((text) => sentence(t(text)))
        .join(' ');
    },
    language,
  });
  const { index, isLast } = reader;
  useWakeLock(true);
  const step = earthquakeSteps[index]!;

  return (
    <Screen>
      <ScreenHeader
        title={t(earthquakeContent.heading)}
        icon={
          <HeaderIcon className="bg-alert-red text-white">
            <EarthquakePictogram className="size-9" />
          </HeaderIcon>
        }
      />
      <StepProgress label={t(uiText.protocol.counter, { current: index + 1, total })} current={index} total={total} />
      {/* Fixed minimum height: the buttons below stay put while the steps change. */}
      <section aria-live="polite" className="flex min-h-60 flex-col gap-3 rounded-[20px] bg-surface p-5">
        <h2 className="font-display text-[1.75rem] leading-tight font-bold text-ink">{t(step.title)}</h2>
        <ol className="flex list-decimal flex-col gap-2 pl-6 text-[1.125rem] leading-relaxed text-ink marker:font-bold marker:text-ink-muted">
          {visibleInstructions(step, home).map((instruction) => (
            <li key={instruction.text.es}>{t(instruction.text)}</li>
          ))}
        </ol>
      </section>

      <ReaderControls reader={reader} />
      {isLast && (
        <MenuButton to="/" variant="blue">
          {t(uiText.protocol.back)}
        </MenuButton>
      )}
      <MenuButton to="/">{t(uiText.protocol.exit)}</MenuButton>
    </Screen>
  );
}
