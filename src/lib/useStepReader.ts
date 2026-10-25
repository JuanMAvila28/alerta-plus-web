// Step-by-step reading with auto-advance (plan section 6.6, "LectorDePasos").
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Language } from '../types';
import { isSpeechAvailable, speak } from './speech';

/**
 * - `needsStart`: the screen just opened, or the browser blocked the voice. Nothing is read until the
 *   first tap anywhere on the screen, which starts the continuous reading.
 * - `ready`: the voice works; each step is read when it is shown.
 * - `unavailable`: no voice, or it keeps failing: the steps are navigated by hand (fix 9.6).
 */
export type Voice = 'ready' | 'needsStart' | 'unavailable';

/** No `start` event within this time = the browser silently blocked the voice (iOS Safari). */
const START_TIMEOUT_MS = 3000;

/**
 * Never speaks on its own when the screen opens. Browsers refuse to speak before a tap on the page
 * (typed URL, reload, shortcut) and some cut the voice off after the first step, so the reading always
 * starts with the tap: the same, predictable behavior everywhere.
 */
const initialVoice = (): Voice => (isSpeechAvailable() ? 'needsStart' : 'unavailable');

/**
 * Reads the steps aloud. With `auto` on (the default) it moves to the next step when a reading ends;
 * with it off it stays on the step. Changing step by hand always reads the step that is shown.
 */
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
  const [auto, setAutoState] = useState(true);
  const [voice, setVoice] = useState<Voice>(initialVoice);
  /** Bumped to read the current step again without changing it (switch turned back on). */
  const [rereads, setRereads] = useState(0);
  const cancelRef = useRef<(() => void) | null>(null);
  const reading = useRef(false);
  const failures = useRef(0);
  /** Step that `start()` already began reading inside the tap; the effect must not read it again. */
  const startedAt = useRef<number | null>(null);
  const autoRef = useRef(auto);
  autoRef.current = auto;
  const textForRef = useRef(textFor);
  textForRef.current = textFor;

  const read = useCallback(
    (stepIndex: number) => {
      cancelRef.current?.();
      reading.current = true;
      const timer = setTimeout(() => {
        cancel();
        setVoice('needsStart');
      }, START_TIMEOUT_MS);
      const cancelSpeech = speak(textForRef.current(stepIndex), language, {
        onStart: () => {
          clearTimeout(timer);
          failures.current = 0;
        },
        onEnd: () => {
          clearTimeout(timer);
          reading.current = false;
          failures.current = 0;
          if (autoRef.current && stepIndex < total - 1) setIndex(stepIndex + 1);
        },
        onError: (error) => {
          clearTimeout(timer);
          reading.current = false;
          if (error === 'not-allowed') {
            setVoice('needsStart');
            return;
          }
          // One failure: move on, as the plan asks. Two in a row: the voice is broken, go manual.
          failures.current += 1;
          if (failures.current >= 2) setVoice('unavailable');
          else if (autoRef.current && stepIndex < total - 1) setIndex(stepIndex + 1);
        },
      });
      const cancel = () => {
        clearTimeout(timer);
        reading.current = false;
        cancelSpeech();
      };
      cancelRef.current = cancel;
    },
    [language, total],
  );

  // Reads whenever the shown step changes, however it changed. Turning `auto` off does not touch the
  // reading in progress: it only stops it from moving on.
  useEffect(() => {
    if (voice !== 'ready') return;
    // The tap that unlocked the voice may also have changed the step: only skip if it is the one already read.
    if (startedAt.current !== index) read(index);
    startedAt.current = null;
    return () => {
      cancelRef.current?.();
      cancelRef.current = null;
    };
  }, [voice, index, rereads, read]);

  /** Must speak inside the tap itself so iOS allows it. */
  const start = useCallback(() => {
    failures.current = 0;
    read(index);
    startedAt.current = index;
    setVoice('ready');
  }, [index, read]);

  // No button: the first tap anywhere is the gesture the browser wants before it lets us speak. Keyboard
  // activation of a button also fires `click`, so it counts too.
  useEffect(() => {
    if (voice !== 'needsStart') return;
    const unlock = (event: MouseEvent) => {
      // Links leave the screen (exit, back): starting to read only to cut it off would just be noise.
      if (event.target instanceof Element && event.target.closest('a[href]')) return;
      start();
    };
    document.addEventListener('click', unlock, { capture: true });
    return () => document.removeEventListener('click', unlock, { capture: true });
  }, [voice, start]);

  const setAuto = useCallback(
    (value: boolean) => {
      setAutoState(value);
      // Still reading: its end will move on by itself. Finished while it was off: read the step again.
      if (value && voice === 'ready' && !reading.current) setRereads((count) => count + 1);
    },
    [voice],
  );

  const next = useCallback(() => setIndex((current) => Math.min(current + 1, total - 1)), [total]);
  const previous = useCallback(() => setIndex((current) => Math.max(current - 1, 0)), []);

  return {
    index,
    voice,
    auto,
    setAuto,
    start,
    next,
    previous,
    isFirst: index === 0,
    isLast: index === total - 1,
  };
}

export type StepReader = ReturnType<typeof useStepReader>;
