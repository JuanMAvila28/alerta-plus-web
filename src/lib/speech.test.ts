import { afterEach, describe, expect, it, vi } from 'vitest';
import { speak } from './speech';

const handlers = { onEnd: vi.fn(), onError: vi.fn() };
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Fake synth that records when each call happened. */
function installSynth(speaking: boolean) {
  const calls: { call: 'cancel' | 'speak'; at: number }[] = [];
  const synth = {
    speaking,
    pending: false,
    cancel: vi.fn(() => calls.push({ call: 'cancel', at: performance.now() })),
    speak: vi.fn(() => calls.push({ call: 'speak', at: performance.now() })),
    getVoices: () => [],
  };
  vi.stubGlobal('speechSynthesis', synth);
  vi.stubGlobal(
    'SpeechSynthesisUtterance',
    class {
      lang = '';
      rate = 1;
      voice = null;
      constructor(public text: string) {}
    },
  );
  return { synth, calls };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('speak after a cancel', () => {
  // Chrome drops a speak() made in the same instant as a cancel(): the reader then thinks the voice is blocked.
  it('waits before speaking when something was still being read', async () => {
    const { synth, calls } = installSynth(true);
    // Let any cancel from an earlier test settle.
    await sleep(150);
    speak('Hola.', 'es', handlers);

    expect(synth.cancel).toHaveBeenCalledTimes(1);
    expect(synth.speak).not.toHaveBeenCalled();
    await vi.waitFor(() => expect(synth.speak).toHaveBeenCalledTimes(1));
    const [cancel, spoke] = calls as [(typeof calls)[number], (typeof calls)[number]];
    expect(cancel.call).toBe('cancel');
    expect(spoke.at - cancel.at).toBeGreaterThanOrEqual(100);
  });

  it('speaks synchronously when nothing is being read (the first reading must stay inside the tap)', async () => {
    const { synth } = installSynth(false);
    await sleep(150);
    speak('Hola.', 'es', handlers);

    expect(synth.cancel).not.toHaveBeenCalled();
    expect(synth.speak).toHaveBeenCalledTimes(1);
  });

  it('does not speak at all if it is cancelled while it waits', async () => {
    const { synth } = installSynth(true);
    await sleep(150);
    const cancel = speak('Hola.', 'es', handlers);
    cancel();
    await sleep(200);

    expect(synth.speak).not.toHaveBeenCalled();
    // Only the cancel that cleared the old reading: cancelling a reading that never began adds none.
    expect(synth.cancel).toHaveBeenCalledTimes(1);
  });
});
