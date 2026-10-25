import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
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
  // No `globals`, so Testing Library does not unmount by itself: a hook left reading would speak into the next test.
  cleanup();
  vi.unstubAllGlobals();
});

/** A tap somewhere on the screen (not on a link). */
const tap = () =>
  act(() => {
    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });

/** Opens the reader and taps once, which is what starts the reading. */
const renderStarted = () => {
  const rendered = render();
  tap();
  return rendered;
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('useStepReader', () => {
  it('opens without reading anything and waits for the first tap', async () => {
    const spoken = installSpeech(() => 'speak');
    const { result } = render();
    await wait(50);
    expect(spoken).toEqual([]);
    expect(result.current).toMatchObject({ voice: 'needsStart', index: 0 });
  });

  it('after the first tap it reads every step and moves on by itself, stopping at the last one', async () => {
    const spoken = installSpeech(() => 'speak');
    const { result } = renderStarted();
    await waitFor(() => expect(result.current.index).toBe(2));
    await waitFor(() => expect(spoken).toEqual(['Uno.', 'Dos.', 'Tres.', 'Cuatro.']));
    expect(result.current).toMatchObject({ voice: 'ready', auto: true, isLast: true });
  });

  it('without speechSynthesis: no voice, steps are changed by hand (fix 9.6)', () => {
    vi.stubGlobal('speechSynthesis', undefined);
    Reflect.deleteProperty(window, 'speechSynthesis');
    const { result } = render();
    expect(result.current.voice).toBe('unavailable');
    act(() => result.current.next());
    act(() => result.current.next());
    act(() => result.current.next());
    expect(result.current.index).toBe(2);
    expect(result.current.isLast).toBe(true);
    act(() => result.current.previous());
    expect(result.current.index).toBe(1);
  });

  it('one failure moves on; two in a row switch to manual', async () => {
    installSpeech(() => 'fail');
    const { result } = renderStarted();
    await waitFor(() => expect(result.current.voice).toBe('unavailable'));
    expect(result.current.index).toBe(1);
  });

  it('blocked by the browser after the tap: asks for another tap, then reads from the same step', async () => {
    let blocked = true;
    const spoken = installSpeech(() => (blocked ? 'not-allowed' : 'speak'));
    const { result } = renderStarted();
    await waitFor(() => expect(result.current.voice).toBe('needsStart'));
    expect(result.current.index).toBe(0);

    blocked = false;
    tap();
    await waitFor(() => expect(result.current.index).toBe(2));
    expect(spoken[0]).toBe('Uno.');
  });
});

describe('useStepReader first tap', () => {
  it('a tap on a link (exit, back) does not start the reading', async () => {
    const spoken = installSpeech(() => 'speak');
    const { result } = render();
    const link = Object.assign(document.createElement('a'), { href: '/emergencia' });
    link.append(document.createElement('span'));
    document.body.append(link);
    act(() => {
      link.firstElementChild!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    link.remove();
    await wait(50);
    expect(spoken).toEqual([]);
    expect(result.current.voice).toBe('needsStart');
  });

  it('stops listening for taps once the reading has started', async () => {
    installSpeech(() => 'speak');
    const remove = vi.spyOn(document, 'removeEventListener');
    const { result } = renderStarted();
    await waitFor(() => expect(result.current.voice).toBe('ready'));
    expect(remove.mock.calls.map(([type]) => type)).toContain('click');
  });

  it('a tap on NEXT starts the voice and reads the step it lands on', async () => {
    const spoken = installSpeech(() => 'speak');
    const { result } = render();
    // What a tap on NEXT does: the document-level listener fires first, then the button's own handler.
    act(() => {
      document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      result.current.next();
    });
    await waitFor(() => expect(result.current.index).toBe(2));
    await waitFor(() => expect(spoken).toContain('Tres.'));
    expect(spoken).toContain('Cuatro.');
  });
});

describe('useStepReader navigation and auto-advance', () => {
  it('starts with auto-advance on', () => {
    installSpeech(() => 'speak');
    const { result } = render();
    expect(result.current).toMatchObject({ auto: true, isFirst: true, isLast: false });
  });

  it('previous and next change the step and read the one that is shown', async () => {
    const spoken = installSpeech(() => 'speak');
    const { result } = renderStarted();
    await waitFor(() => expect(result.current.index).toBe(2));
    await waitFor(() => expect(spoken).toHaveLength(4));

    act(() => result.current.previous());
    expect(result.current.index).toBe(1);
    // Auto-advance is on: it reads the step it went back to and carries on from there.
    await waitFor(() => expect(spoken.slice(4)).toEqual(['Tres.', 'Cuatro.']));
  });

  it('does not go past the first or the last step', () => {
    installSpeech(() => 'speak');
    const { result } = render();
    act(() => result.current.previous());
    expect(result.current.index).toBe(0);
    act(() => result.current.next());
    act(() => result.current.next());
    act(() => result.current.next());
    expect(result.current.index).toBe(2);
  });

  it('with auto-advance off it finishes the reading but stays on the step', async () => {
    const spoken = installSpeech(() => 'speak');
    const { result } = renderStarted();
    act(() => result.current.setAuto(false));
    await waitFor(() => expect(spoken).toEqual(['Uno.', 'Dos.']));
    // Give it time to (wrongly) move on.
    await wait(50);
    expect(result.current.index).toBe(0);
  });

  it('with auto-advance off, going to another step reads it and stops there', async () => {
    const spoken = installSpeech(() => 'speak');
    const { result } = renderStarted();
    act(() => result.current.setAuto(false));
    await waitFor(() => expect(spoken).toHaveLength(2));

    act(() => result.current.next());
    await waitFor(() => expect(spoken.at(-1)).toBe('Tres.'));
    await wait(50);
    expect(result.current.index).toBe(1);
  });

  it('turning auto-advance back on reads the current step again and keeps going', async () => {
    const spoken = installSpeech(() => 'speak');
    const { result } = renderStarted();
    act(() => result.current.setAuto(false));
    await waitFor(() => expect(spoken).toHaveLength(2));
    await wait(20);

    act(() => result.current.setAuto(true));
    await waitFor(() => expect(result.current.index).toBe(2));
    await waitFor(() => expect(spoken.slice(2)).toEqual(['Uno.', 'Dos.', 'Tres.', 'Cuatro.']));
  });

  it('turning auto-advance on while it is still reading does not read it twice', async () => {
    const spoken = installSpeech(() => 'speak');
    const { result } = renderStarted();
    act(() => result.current.setAuto(false));
    act(() => result.current.setAuto(true));
    await waitFor(() => expect(result.current.index).toBe(2));
    await waitFor(() => expect(spoken).toEqual(['Uno.', 'Dos.', 'Tres.', 'Cuatro.']));
  });
});

describe('splitSentences', () => {
  it('splits on sentence punctuation', () => {
    expect(splitSentences('PROTÉGETE. ¿Estás bien? Sal ya!  Fin')).toEqual(['PROTÉGETE.', '¿Estás bien?', 'Sal ya!', 'Fin']);
  });
});
