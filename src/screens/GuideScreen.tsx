import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import { useState } from 'react';
import { Navigate, useParams } from 'react-router';
import { premiumContent, uiText } from '../content';
import { Illustration } from '../components/Illustration';
import { Button, MenuButton, PAIR_BUTTON_CLASS } from '../components/MenuButton';
import { Screen, ScreenHeader, StepProgress } from '../components/Screen';
import { useLanguage } from '../lib/i18n';
import type { Guide } from '../types';

/** /premium/guias/:index (plan section 6.11). No voice, like the original. */
export default function GuideScreen() {
  const { index } = useParams();
  const guide = premiumContent.library.guides[Number(index)];
  if (!guide || !/^\d+$/.test(index ?? '')) return <Navigate to="/premium/guias" replace />;
  return <GuideSteps key={index} guide={guide} />;
}

function GuideSteps({ guide }: { guide: Guide }) {
  const { t } = useLanguage();
  const [stepIndex, setStepIndex] = useState(0);
  const { library } = premiumContent;
  const step = guide.steps[stepIndex]!;
  const total = guide.steps.length;

  return (
    <Screen>
      <ScreenHeader title={t(guide.title)} />
      <StepProgress
        label={t(uiText.protocol.counter, { current: stepIndex + 1, total })}
        current={stepIndex}
        total={total}
      />
      <section aria-live="polite" className="flex flex-col gap-4">
        <Illustration name={step.illustration} label={t(step.label)} />
        <div className="flex flex-col gap-2 rounded-[20px] bg-surface p-5">
          <p className="font-display text-[1.5rem] leading-tight font-bold text-ink">{t(step.action)}</p>
          <p className="text-ink-muted">{t(step.explanation)}</p>
        </div>
      </section>
      <div className="grid grid-cols-2 gap-3">
        <Button disabled={stepIndex === 0} onClick={() => setStepIndex(stepIndex - 1)} className={PAIR_BUTTON_CLASS}>
          <CaretLeft size={20} weight="bold" aria-hidden="true" />
          {t(library.previousButton)}
        </Button>
        <Button
          disabled={stepIndex === total - 1}
          onClick={() => setStepIndex(stepIndex + 1)}
          className={PAIR_BUTTON_CLASS}
        >
          {t(library.nextButton)}
          <CaretRight size={20} weight="bold" aria-hidden="true" />
        </Button>
      </div>
      <MenuButton to="/premium/guias">{t(library.backToGuidesButton)}</MenuButton>
    </Screen>
  );
}
