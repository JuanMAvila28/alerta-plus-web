import { useEffect } from 'react';
import { uiText } from '../content';
import { useLanguage } from '../lib/i18n';

const DURATION_MS = 1500;

/** Quiet line, a tremor, quiet again: drawn once while the splash is up (static with reduced motion). */
const TRACE =
  'M0 24H78l5-5 5 10 5-17 6 26 6-34 6 40 6-31 5 22 5-15 5 10 4-7 4 4 4-2H240';

export default function Splash({ onDone }: { onDone: () => void }) {
  const { t } = useLanguage();

  useEffect(() => {
    const timer = setTimeout(onDone, DURATION_MS);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-splash px-6 text-center">
      <img src="/logo.svg" alt="" width={128} height={128} />
      <div className="flex flex-col items-center gap-2">
        <h1 className="font-display text-[3.25rem] leading-none font-extrabold tracking-[0.01em] text-white">
          {t(uiText.app.name)}
        </h1>
        <p className="text-body text-splash-text">{t(uiText.app.splashTagline)}</p>
      </div>
      <svg viewBox="0 0 240 48" fill="none" aria-hidden="true" className="mt-2 w-60 max-w-full">
        <path
          d={TRACE}
          pathLength={1}
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-splash-trace [stroke-dasharray:1] motion-safe:animate-[trace_1300ms_var(--ease-out-quart)_both]"
        />
      </svg>
    </div>
  );
}
