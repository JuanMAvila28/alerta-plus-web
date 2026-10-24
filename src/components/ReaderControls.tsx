import { uiText } from '../content';
import { useLanguage } from '../lib/i18n';
import type { ReaderMode } from '../lib/useStepReader';
import { newTexts } from '../newTexts';
import { Button } from './MenuButton';

/** What goes under the step: start button, manual "next", or "the app will continue…". */
export function ReaderControls({
  mode,
  isLast,
  onStart,
  onNext,
}: {
  mode: ReaderMode;
  isLast: boolean;
  onStart: () => void;
  onNext: () => void;
}) {
  const { t } = useLanguage();

  if (mode === 'needsStart') {
    return (
      <div className="flex flex-col gap-2">
        <Button variant="red" onClick={onStart}>
          {t(newTexts.reader.start)}
        </Button>
        <p className="text-center text-base text-slate-700">{t(newTexts.reader.startHint)}</p>
      </div>
    );
  }
  if (isLast) return null;
  if (mode === 'manual') {
    return (
      <Button variant="blue" onClick={onNext}>
        {t(newTexts.reader.next)}
      </Button>
    );
  }
  return <p className="text-center text-base text-slate-700">{t(uiText.protocol.autoContinue)}</p>;
}
