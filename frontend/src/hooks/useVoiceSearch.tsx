import { useCallback, useEffect, useRef, useState } from "react";

/** Minimal typings for the Web Speech API (not in TypeScript's DOM lib). */
interface SpeechAlternativeLike {
  transcript: string;
}
interface SpeechResultLike {
  readonly isFinal: boolean;
  readonly length: number;
  [index: number]: SpeechAlternativeLike;
}
interface SpeechEventLike {
  readonly resultIndex: number;
  readonly results: ArrayLike<SpeechResultLike>;
}
interface SpeechErrorEventLike {
  readonly error: string;
}
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onresult: ((e: SpeechEventLike) => void) | null;
  onerror: ((e: SpeechErrorEventLike) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

// Short on purpose: they are shown inside the search box placeholder (no layout shift), even on a 360px phone.
const ERROR_MESSAGES: Record<string, string> = {
  "not-allowed": "Mic access blocked",
  "service-not-allowed": "Mic access blocked",
  "no-speech": "Didn't catch that. Retry",
  "audio-capture": "No microphone found",
  network: "Voice needs internet",
};
const FALLBACK_ERROR = "Voice unavailable";
/** Errors clear themselves so the box goes back to normal. */
const ERROR_VISIBLE_MS = 5000;

interface Options {
  /** Live (interim) text while the user is still speaking. */
  onTranscript?: (text: string) => void;
  /** Final text once the user stops speaking. */
  onFinal: (text: string) => void;
  /** BCP-47 language tag. Indian English by default. */
  lang?: string;
}

export interface VoiceSearch {
  /** False in browsers without the Web Speech API (e.g. Firefox) — hide the mic button. */
  supported: boolean;
  listening: boolean;
  error: string | null;
  /** Start listening, or stop if already listening. */
  toggle: () => void;
}

/**
 * Voice input for search boxes, built on the browser's SpeechRecognition.
 * Needs HTTPS (or localhost) and microphone permission; the browser asks the user the first time.
 */
export function useVoiceSearch({ onTranscript, onFinal, lang = "en-IN" }: Options): VoiceSearch {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const supported = getRecognitionCtor() !== null;

  // Keep the latest callbacks without restarting a running session.
  const cbRef = useRef({ onTranscript, onFinal });
  useEffect(() => {
    cbRef.current = { onTranscript, onFinal };
  }, [onTranscript, onFinal]);

  useEffect(() => () => recRef.current?.abort(), []);

  useEffect(() => {
    if (!error) return;
    const t = window.setTimeout(() => setError(null), ERROR_VISIBLE_MS);
    return () => window.clearTimeout(t);
  }, [error]);

  const toggle = useCallback(() => {
    if (recRef.current) {
      recRef.current.stop();
      return;
    }
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;

    const rec = new Ctor();
    rec.lang = lang;
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;
    let finalText = "";

    rec.onstart = () => {
      setError(null);
      setListening(true);
    };
    rec.onresult = (e) => {
      let text = "";
      let isFinal = false;
      for (let i = 0; i < e.results.length; i += 1) {
        const r = e.results[i];
        text += r[0]?.transcript ?? "";
        if (r.isFinal) isFinal = true;
      }
      text = text.trim();
      if (isFinal) finalText = text;
      else cbRef.current.onTranscript?.(text);
    };
    rec.onerror = (e) => {
      if (e.error === "aborted") return;
      setError(ERROR_MESSAGES[e.error] ?? FALLBACK_ERROR);
    };
    rec.onend = () => {
      recRef.current = null;
      setListening(false);
      if (finalText) cbRef.current.onFinal(finalText);
    };

    recRef.current = rec;
    try {
      rec.start();
    } catch {
      recRef.current = null;
      setError(FALLBACK_ERROR);
    }
  }, [lang]);

  return { supported, listening, error, toggle };
}