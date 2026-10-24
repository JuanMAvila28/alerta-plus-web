// Step-by-step reading with auto-advance (plan section 6.6, "LectorDePasos").
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Language } from '../types';
import { isSpeechAvailable, speak } from './speech';

/**
 * - `auto`: reads each step and moves on when the reading ends.
 * - `needsStart`: the browser will not speak without a tap (iOS / autoplay policy): show "▶ START".
 * - `manual`: no voice, or it keeps failing: show "NEXT STEP" (fix 9.6).
 */
export type ReaderMode = 'auto' | 'needsStart' | 'manual';

/** No `start` event within this time = the browser silently blocked the voice (iOS Safari). */
const START_TIMEOUT_MS = 3000;

function initialMode(): ReaderMode {
  if (!isSpeechAvailable()) return 'manual';
  const activation = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation;
  // Opened from a shortcut or a link: no tap yet, so the voice would be blocked.
  return activation && !activation.hasBeenActive ? 'needsStart' : 'auto';
}

export function useStepReader({
  total,
  textFor,
  language,
}: {
  total: number;
  /** What is read for step `index`. */
  textFor: (index: number) => string;
  language: Language;
}) {
  const [index, setIndex] = useState(0);
  const [mode, setMode] = useState<ReaderMode>(initialMode);
  const cancelRef = useRef<(() => void) | null>(null);
  const failures = useRef(0);
  /** `start()` already began reading inside the tap; the effect must not read it again. */
  const alreadyReading = useRef(false);
  const textForRef = useRef(textFor);
  textForRef.current = textFor;

  const read = useCallback(
    (stepIndex: number) => {
      cancelRef.current?.();
      let started = false;
      const timer = setTimeout(() => {
        if (started) return;
        cancel();
        setMode('needsStart');
      }, START_TIMEOUT_MS);
      const cancelSpeech = speak(textForRef.current(stepIndex), language, {
        onStart: () => {
          started = true;
          failures.current = 0;
        },
        onEnd: () => {
          started = true;
          clearTimeout(timer);
          failures.current = 0;
          if (stepIndex < total - 1) setIndex(stepIndex + 1);
        },
        onError: (error) => {
          clearTimeout(timer);
          if (error === 'not-allowed') {
            setMode('needsStart');
            return;
          }
          // One failure: move on, as the plan asks. Two in a row: the voice is broken, go manual.
          failures.current += 1;
          if (failures.current >= 2) setMode('manual');
          else if (stepIndex < total - 1) setIndex(stepIndex + 1);
        },
      });
      const cancel = () => {
        clearTimeout(timer);
        cancelSpeech();
      };
      cancelRef.current = cancel;
    },
    [language, total],
  );

  useEffect(() => {
    if (mode !== 'auto') return;
    if (alreadyReading.current) alreadyReading.current = false;
    else read(index);
    return () => {
      cancelRef.current?.();
      cancelRef.current = null;
    };
  }, [mode, index, read]);

  /** "▶ START": must speak inside the tap itself so iOS allows it. */
  const start = useCallback(() => {
    failures.current = 0;
    read(index);
    alreadyReading.current = true;
    setMode('auto');
  }, [index, read]);

  const next = useCallback(() => setIndex((current) => Math.min(current + 1, total - 1)), [total]);

  return { index, mode, start, next, isLast: index === total - 1 };
}
