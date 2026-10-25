// Read aloud with the Web Speech API (plan section 6.6).
import type { Language } from '../types';

export const SPEECH_LANG: Record<Language, string> = { es: 'es-CO', en: 'en-US' };
const RATE = 0.9;

export const isSpeechAvailable = () =>
  typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;

/** Best voice for the language: exact match (es-CO), then same language (es-*); else the default voice. */
export function pickVoice(voices: SpeechSynthesisVoice[], language: Language): SpeechSynthesisVoice | undefined {
  const lang = SPEECH_LANG[language].toLowerCase();
  const normalized = (voice: SpeechSynthesisVoice) => voice.lang.toLowerCase().replace('_', '-');
  return (
    voices.find((voice) => normalized(voice) === lang) ??
    voices.find((voice) => normalized(voice).startsWith(`${language}-`) || normalized(voice) === language)
  );
}

let voices: SpeechSynthesisVoice[] = [];
if (isSpeechAvailable()) {
  const load = () => (voices = window.speechSynthesis.getVoices());
  load();
  window.speechSynthesis.addEventListener?.('voiceschanged', load);
}

/**
 * Splits long text into sentences: Chrome stops utterances longer than ~15 s,
 * and a sentence queue also lets the reading be cancelled cleanly.
 */
export function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

export type SpeechError = 'not-allowed' | 'failed';

export interface SpeakHandlers {
  onStart?: () => void;
  onEnd: () => void;
  onError: (error: SpeechError) => void;
}

// Chrome can garbage-collect an utterance before `end` fires; keep a reference while it runs.
const alive = new Set<SpeechSynthesisUtterance>();

/**
 * Chrome silently drops a `speak()` made in the same instant as a `cancel()`: no `start` event ever
 * arrives and the reader would think the voice was blocked. Keep this gap between the two.
 */
const SETTLE_MS = 120;
let lastCancel = Number.NEGATIVE_INFINITY;

function cancelSpeech() {
  window.speechSynthesis.cancel();
  lastCancel = performance.now();
}

/**
 * Reads `text` and calls `onEnd` after the last sentence. Returns a function that cancels it.
 * With nothing speaking and no recent cancel it speaks synchronously: iOS only allows the first
 * reading inside the tap itself.
 */
export function speak(text: string, language: Language, handlers: SpeakHandlers): () => void {
  const synth = window.speechSynthesis;
  const sentences = splitSentences(text);
  let cancelled = false;
  let started = false;
  let running = false;
  let finished = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  if (synth.speaking || synth.pending) cancelSpeech();
  if (sentences.length === 0) {
    queueMicrotask(() => !cancelled && handlers.onEnd());
    return () => {
      cancelled = true;
    };
  }

  const run = () => {
    running = true;
    const voice = pickVoice(voices.length ? voices : synth.getVoices(), language);
    sentences.forEach((sentence, index) => {
      const utterance = new SpeechSynthesisUtterance(sentence);
      utterance.lang = SPEECH_LANG[language];
      utterance.rate = RATE;
      if (voice) utterance.voice = voice;
      alive.add(utterance);
      utterance.onstart = () => {
        if (cancelled || started) return;
        started = true;
        handlers.onStart?.();
      };
      utterance.onend = () => {
        alive.delete(utterance);
        if (cancelled || index !== sentences.length - 1) return;
        finished = true;
        handlers.onEnd();
      };
      utterance.onerror = (event) => {
        alive.delete(utterance);
        // `interrupted` / `canceled` come from our own cancel().
        if (cancelled || event.error === 'interrupted' || event.error === 'canceled') return;
        cancelled = true;
        cancelSpeech();
        handlers.onError(event.error === 'not-allowed' ? 'not-allowed' : 'failed');
      };
      synth.speak(utterance);
    });
  };

  const wait = lastCancel + SETTLE_MS - performance.now();
  if (wait > 0) timer = setTimeout(() => !cancelled && run(), wait);
  else run();

  return () => {
    cancelled = true;
    clearTimeout(timer);
    // Nothing to cancel if it never began or already ended: skipping it keeps the next reading immediate.
    if (running && !finished) cancelSpeech();
  };
}

export function stopSpeaking() {
  if (isSpeechAvailable()) cancelSpeech();
}
