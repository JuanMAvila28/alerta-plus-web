import { ArrowCounterClockwise, CheckCircle, Trophy, XCircle } from '@phosphor-icons/react';
import { useState } from 'react';
import { premiumContent } from '../content';
import { Button, MenuButton } from '../components/MenuButton';
import { HeaderIcon, Screen, ScreenHeader, StepProgress } from '../components/Screen';
import { useLanguage } from '../lib/i18n';
import { newTexts } from '../newTexts';

/** /premium/practica (plan section 6.11). */
export default function PracticeScreen() {
  const { t } = useLanguage();
  const { practice } = premiumContent;
  const total = practice.questions.length;
  const [current, setCurrent] = useState(0);
  const [answer, setAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const done = current >= total;

  const choose = (option: number) => {
    setAnswer(option);
    if (option === practice.questions[current]!.correct) setScore(score + 1);
  };
  const advance = () => {
    setAnswer(null);
    setCurrent(current + 1);
  };
  const restart = () => {
    setCurrent(0);
    setAnswer(null);
    setScore(0);
  };

  if (done) {
    return (
      <Screen>
        <ScreenHeader
          title={t(practice.end.title)}
          icon={
            <HeaderIcon className="bg-safe/15 text-safe">
              <Trophy size={28} weight="bold" aria-hidden="true" />
            </HeaderIcon>
          }
        />
        <section className="flex flex-col gap-3 rounded-[20px] bg-surface p-5">
          <p role="status" className="font-display text-[1.75rem] leading-tight font-bold text-ink">
            {t(practice.end.result, { score, total })}
          </p>
          <div aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-line">
            <div className="h-full origin-left rounded-full bg-safe" style={{ transform: `scaleX(${score / total})` }} />
          </div>
          <p className="text-ink-muted">{t(practice.end.note)}</p>
        </section>
        <Button variant="blue" onClick={restart}>
          <ArrowCounterClockwise size={20} weight="bold" aria-hidden="true" />
          {t(practice.end.repeatButton)}
        </Button>
        <MenuButton to="/premium" className="mt-auto">
          {t(practice.backButton)}
        </MenuButton>
      </Screen>
    );
  }

  const question = practice.questions[current]!;
  const answered = answer !== null;
  const wasCorrect = answer === question.correct;

  return (
    <Screen>
      <header className="flex flex-col gap-4 pt-3">
        <StepProgress label={t(practice.counter, { current: current + 1, total })} current={current} total={total} />
        <h1 className="font-display text-[1.875rem] leading-tight font-bold text-ink">{t(question.question)}</h1>
      </header>

      <div className="flex flex-col gap-3">
        {question.options.map((option, index) => {
          // Improvement over the original (plan 6.11): green for the right answer, red for a wrong choice,
          // each with its own icon so the result never depends on color alone.
          const state = !answered ? 'idle' : index === question.correct ? 'correct' : index === answer ? 'wrong' : 'other';
          const styles = {
            idle: 'border-line bg-page text-ink hover:bg-surface active:bg-surface-pressed',
            correct: 'border-safe bg-safe/10 text-ink',
            wrong: 'border-danger bg-danger/10 text-ink',
            other: 'border-line text-ink-muted',
          }[state];
          return (
            <button
              key={option.es}
              type="button"
              disabled={answered}
              onClick={() => choose(index)}
              className={`flex min-h-14 w-full cursor-pointer items-center gap-3 rounded-[16px] border-2 px-4 py-3 text-left font-bold transition-colors duration-150 disabled:cursor-default ${styles}`}
            >
              <span className="flex-1">{t(option)}</span>
              {state === 'correct' && <CheckCircle size={24} weight="fill" aria-hidden="true" className="shrink-0 text-safe" />}
              {state === 'wrong' && <XCircle size={24} weight="fill" aria-hidden="true" className="shrink-0 text-danger" />}
            </button>
          );
        })}
      </div>

      {answered && (
        <section
          role="status"
          className="flex flex-col gap-3 rounded-[20px] bg-surface p-4 motion-safe:animate-[fade-in_200ms_ease-out]"
        >
          <p className={`font-display text-[1.375rem] leading-tight font-bold ${wasCorrect ? 'text-safe' : 'text-danger'}`}>
            {t(wasCorrect ? newTexts.premium.correct : newTexts.premium.incorrect)}
          </p>
          <p className="text-ink">{t(question.explanation)}</p>
          <Button variant="blue" onClick={advance}>
            {t(practice.continueButton)}
          </Button>
        </section>
      )}

      <MenuButton to="/premium" className="mt-auto">
        {t(practice.backButton)}
      </MenuButton>
    </Screen>
  );
}
