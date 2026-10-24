import { useState } from 'react';
import { Navigate, useParams } from 'react-router';
import { premiumContent, uiText } from '../content';
import { Illustration } from '../components/Illustration';
import { Button, MenuButton } from '../components/MenuButton';
import { Screen } from '../components/Screen';
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
      <h1 className="text-center text-[26px] font-bold">{t(guide.title)}</h1>
      <p className="text-center text-lg font-bold text-alert-blue">
        {t(uiText.protocol.counter, { current: stepIndex + 1, total })}
      </p>
      <section aria-live="polite" className="flex flex-col gap-3">
        <Illustration name={step.illustration} label={t(step.label)} />
        <p className="text-[19px] font-bold">{t(step.action)}</p>
        <p className="text-base">{t(step.explanation)}</p>
      </section>
      <div className="flex gap-3">
        <Button disabled={stepIndex === 0} onClick={() => setStepIndex(stepIndex - 1)}>
          {t(library.previousButton)}
        </Button>
        <Button variant="blue" disabled={stepIndex === total - 1} onClick={() => setStepIndex(stepIndex + 1)}>
          {t(library.nextButton)}
        </Button>
      </div>
      <MenuButton to="/premium/guias">{t(library.backToGuidesButton)}</MenuButton>
    </Screen>
  );
}
