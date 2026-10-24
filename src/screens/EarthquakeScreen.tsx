import { earthquakeContent, uiText } from '../content';
import { MenuButton } from '../components/MenuButton';
import { ReaderControls } from '../components/ReaderControls';
import { Screen } from '../components/Screen';
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
  const { index, mode, start, next, isLast } = useStepReader({
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
  useWakeLock(true);
  const step = earthquakeSteps[index]!;

  return (
    <Screen>
      <h1 className="text-center text-[28px] font-bold text-alert-red">{t(earthquakeContent.heading)}</h1>
      <p className="text-center text-xl font-bold">{t(uiText.protocol.counter, { current: index + 1, total })}</p>
      <section aria-live="polite" className="flex flex-col gap-3">
        <h2 className="text-center text-2xl font-bold text-alert-blue">{t(step.title)}</h2>
        <ol className="flex list-decimal flex-col gap-2 pl-7 text-lg leading-relaxed marker:font-bold">
          {visibleInstructions(step, home).map((instruction) => (
            <li key={instruction.text.es}>{t(instruction.text)}</li>
          ))}
        </ol>
      </section>

      <ReaderControls mode={mode} isLast={isLast} onStart={start} onNext={next} />
      {isLast && (
        <MenuButton to="/" variant="blue">
          {t(uiText.protocol.back)}
        </MenuButton>
      )}
      <MenuButton to="/">{t(uiText.protocol.exit)}</MenuButton>
    </Screen>
  );
}
