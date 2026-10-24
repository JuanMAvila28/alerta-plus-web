import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { splitSentences } from './speech';
import { useStepReader } from './useStepReader';

type Behavior = 'speak' | 'fail' | 'not-allowed';

/** Fake speechSynthesis: each utterance starts and ends on the next tick, or fails. */
function installSpeech(behavior: () => Behavior) {
  const spoken: string[] = [];
  let queue: ReturnType<typeof setTimeout>[] = [];
  const synth = {
    speak(utterance: SpeechSynthesisUtterance) {
      const mode = behavior();
      queue.push(
        setTimeout(() => {
          if (mode === 'speak') {
            spoken.push(utterance.text);
            utterance.onstart?.(new Event('start') as SpeechSynthesisEvent);
            utterance.onend?.(new Event('end') as SpeechSynthesisEvent);
          } else {
            utterance.onerror?.({ error: mode === 'fail' ? 'synthesis-failed' : 'not-allowed' } as SpeechSynthesisErrorEvent);
          }
        }, 0),
      );
    },
    cancel() {
      queue.forEach(clearTimeout);
      queue = [];
    },
    getVoices: () => [],
  };
  vi.stubGlobal('speechSynthesis', synth);
  vi.stubGlobal(
    'SpeechSynthesisUtterance',
    class {
      lang = '';
      rate = 1;
      voice = null;
      onstart: ((e: Event) => void) | null = null;
      onend: ((e: Event) => void) | null = null;
      onerror: ((e: unknown) => void) | null = null;
      constructor(public text: string) {}
    },
  );
  return spoken;
}

const steps = ['Uno. Dos.', 'Tres.', 'Cuatro.'];
const render = () =>
  renderHook(() => useStepReader({ total: steps.length, textFor: (i) => steps[i]!, language: 'es' }));

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useStepReader', () => {
  it('reads every step and moves on by itself, stopping at the last one', async () => {
    const spoken = installSpeech(() => 'speak');
    const { result } = render();
    await waitFor(() => expect(result.current.index).toBe(2));
    await waitFor(() => expect(spoken).toEqual(['Uno.', 'Dos.', 'Tres.', 'Cuatro.']));
    expect(result.current).toMatchObject({ mode: 'auto', isLast: true });
  });

  it('without speechSynthesis: manual mode with a next button (fix 9.6)', () => {
    vi.stubGlobal('speechSynthesis', undefined);
    Reflect.deleteProperty(window, 'speechSynthesis');
    const { result } = render();
    expect(result.current.mode).toBe('manual');
    act(() => result.current.next());
    act(() => result.current.next());
    act(() => result.current.next());
    expect(result.current.index).toBe(2);
  });

  it('one failure moves on; two in a row switch to manual', async () => {
    installSpeech(() => 'fail');
    const { result } = render();
    await waitFor(() => expect(result.current.mode).toBe('manual'));
    expect(result.current.index).toBe(1);
  });

  it('blocked by the browser: asks for a tap, then reads from the same step', async () => {
    let blocked = true;
    const spoken = installSpeech(() => (blocked ? 'not-allowed' : 'speak'));
    const { result } = render();
    await waitFor(() => expect(result.current.mode).toBe('needsStart'));
    expect(result.current.index).toBe(0);

    blocked = false;
    act(() => result.current.start());
    await waitFor(() => expect(result.current.index).toBe(2));
    expect(spoken[0]).toBe('Uno.');
  });
});

describe('splitSentences', () => {
  it('splits on sentence punctuation', () => {
    expect(splitSentences('PROTÉGETE. ¿Estás bien? Sal ya!  Fin')).toEqual(['PROTÉGETE.', '¿Estás bien?', 'Sal ya!', 'Fin']);
  });
});
