import { useState } from 'react';
import { premiumContent } from '../content';
import { Button, MenuButton } from '../components/MenuButton';
import { Screen } from '../components/Screen';
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
        <h1 className="text-center text-[28px] font-bold">{t(practice.end.title)}</h1>
        <p className="text-center text-xl font-bold">{t(practice.end.result, { score, total })}</p>
        <p className="text-center text-base">{t(practice.end.note)}</p>
        <Button variant="blue" onClick={restart}>
          {t(practice.end.repeatButton)}
        </Button>
        <MenuButton to="/premium">{t(practice.backButton)}</MenuButton>
      </Screen>
    );
  }

  const question = practice.questions[current]!;
  const answered = answer !== null;
  const wasCorrect = answer === question.correct;

  return (
    <Screen>
      <p className="text-center text-lg font-bold text-alert-blue">{t(practice.counter, { current: current + 1, total })}</p>
      <h1 className="text-center text-2xl font-bold">{t(question.question)}</h1>

      <div className="flex flex-col gap-3">
        {question.options.map((option, index) => {
          // Improvement over the original (plan 6.11): green for the right answer, red for a wrong choice.
          const color = !answered
            ? 'border-alert-blue text-alert-blue'
            : index === question.correct
              ? 'border-green-700 bg-green-50 text-green-900'
              : index === answer
                ? 'border-alert-red bg-red-50 text-red-900'
                : 'border-slate-300 text-slate-500';
          return (
            <button
              key={option.es}
              type="button"
              disabled={answered}
              onClick={() => choose(index)}
              className={`min-h-[52px] rounded-xl border-2 px-4 py-3 text-lg font-bold ${color}`}
            >
              {t(option)}
            </button>
          );
        })}
      </div>

      {answered && (
        <section role="status" className="flex flex-col gap-3 rounded-xl bg-premium-card p-4">
          <p className={`text-lg font-bold ${wasCorrect ? 'text-green-800' : 'text-alert-red'}`}>
            {t(wasCorrect ? newTexts.premium.correct : newTexts.premium.incorrect)}
          </p>
          <p className="text-base">{t(question.explanation)}</p>
          <Button variant="blue" onClick={advance}>
            {t(practice.continueButton)}
          </Button>
        </section>
      )}

      <MenuButton to="/premium">{t(practice.backButton)}</MenuButton>
    </Screen>
  );
}
