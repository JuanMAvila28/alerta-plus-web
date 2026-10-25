import { CaretLeft, CaretRight, SpeakerHigh } from '@phosphor-icons/react';
import { useId } from 'react';
import { uiText } from '../content';
import { useLanguage } from '../lib/i18n';
import type { StepReader } from '../lib/useStepReader';
import { newTexts } from '../newTexts';
import { Button, PAIR_BUTTON_CLASS } from './MenuButton';

/**
 * What goes under the step, above "exit protocol": the "tap the screen" notice until the first tap starts
 * the reading, previous / next, and the switch that turns automatic advance on and off.
 */
export function ReaderControls({ reader }: { reader: StepReader }) {
  const { t } = useLanguage();
  const hintId = useId();
  const { voice, auto, setAuto, next, previous, isFirst, isLast } = reader;

  const hint =
    voice === 'needsStart'
      ? undefined
      : t(auto ? uiText.protocol.autoContinue : newTexts.reader.autoOffHint);

  return (
    <div className="flex flex-col gap-3">
      {voice === 'needsStart' && (
        <p
          role="status"
          className="flex items-center gap-3.5 rounded-[16px] border-2 border-alert-blue/40 bg-alert-blue/8 p-4 font-semibold text-ink"
        >
          {/* The one pulse on the screen: this is what the person has to do next. */}
          <SpeakerHigh
            size={28}
            weight="bold"
            aria-hidden="true"
            className="shrink-0 text-link motion-safe:animate-pulse"
          />
          {t(newTexts.reader.startHint)}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Button disabled={isFirst} onClick={previous} className={PAIR_BUTTON_CLASS}>
          <CaretLeft size={20} weight="bold" aria-hidden="true" />
          {t(newTexts.reader.previous)}
        </Button>
        <Button disabled={isLast} onClick={next} className={PAIR_BUTTON_CLASS}>
          {t(newTexts.reader.next)}
          <CaretRight size={20} weight="bold" aria-hidden="true" />
        </Button>
      </div>

      {voice !== 'unavailable' && (
        <button
          type="button"
          role="switch"
          aria-checked={auto}
          aria-describedby={hint ? hintId : undefined}
          onClick={() => setAuto(!auto)}
          className="flex min-h-16 w-full cursor-pointer items-center gap-4 rounded-[18px] bg-surface px-4 py-3 text-left transition-colors duration-150 hover:bg-surface-pressed active:bg-surface-pressed"
        >
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-label font-bold tracking-[0.03em] text-ink">{t(newTexts.reader.autoAdvance)}</span>
            {hint && (
              <span id={hintId} className="text-caption text-ink-muted">
                {hint}
              </span>
            )}
          </span>
          {/* Position and fill both change, so the state never depends on color alone. */}
          <span
            aria-hidden="true"
            className={`relative h-8 w-14 shrink-0 rounded-full border-2 transition-colors duration-200 ${
              auto ? 'border-alert-blue bg-alert-blue' : 'border-ink-muted bg-transparent'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 size-6 rounded-full transition-[translate,background-color] duration-200 ease-out-quart ${
                auto ? 'translate-x-6 bg-white' : 'bg-ink-muted'
              }`}
            />
          </span>
        </button>
      )}
    </div>
  );
}
