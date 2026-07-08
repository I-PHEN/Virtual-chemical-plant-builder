"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useVoice — wraps the browser Web Speech API for speech-to-text and
 * the SpeechSynthesis API for text-to-speech.
 *
 * Two modes:
 *  - Push-to-talk: tap mic, speak one utterance, mic auto-stops.
 *  - Hands-free: mic stays on continuously. Automatically pauses while
 *    the AI is speaking (so it doesn't hear itself) and resumes ~600ms
 *    after the AI finishes.
 *
 * Captions: uses the `boundary` event from SpeechSynthesis to report
 * word-by-word progress so the UI can reveal captions as words are
 * spoken — like real subtitles.
 */

interface UseVoiceOptions {
  onFinalTranscript?: (text: string) => void;
  onCaptionProgress?: (charIndex: number) => void;
}

export function useVoice(options: UseVoiceOptions = {}) {
  const { onFinalTranscript } = options;

  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [interim, setInterim] = useState("");
  const [handsFree, setHandsFree] = useState(false);
  const [supported] = useState<{ recognition: boolean; synthesis: boolean }>(() => {
    if (typeof window === "undefined") return { recognition: false, synthesis: false };
    const SR =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    return {
      recognition: !!SR,
      synthesis: "speechSynthesis" in window,
    };
  });

  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef("");
  const onFinalRef = useRef(onFinalTranscript);
  const onProgressRef = useRef<((charIndex: number) => void) | null>(null);
  const handsFreeRef = useRef(false);
  const aiSpeakingRef = useRef(false);
  const wantListeningRef = useRef(false);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    onFinalRef.current = onFinalTranscript;
  }, [onFinalTranscript]);

  useEffect(() => {
    handsFreeRef.current = handsFree;
  }, [handsFree]);

  // ─── Speech recognition setup ───
  useEffect(() => {
    if (typeof window === "undefined") return;
    const SR =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";
    rec.maxAlternatives = 1;

    rec.onresult = (event: any) => {
      let interimText = "";
      let finalText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += transcript;
        else interimText += transcript;
      }
      if (finalText) finalTranscriptRef.current += finalText;
      setInterim(interimText);
    };

    rec.onerror = (event: any) => {
      if (event.error !== "no-speech" && event.error !== "aborted") {
        console.warn("[voice] recognition error", event.error);
      }
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        wantListeningRef.current = false;
        setIsListening(false);
      }
    };

    rec.onend = () => {
      setIsListening(false);
      setInterim("");
      const final = finalTranscriptRef.current.trim();
      finalTranscriptRef.current = "";
      if (final && onFinalRef.current) onFinalRef.current(final);

      if (wantListeningRef.current && !aiSpeakingRef.current && handsFreeRef.current) {
        restartTimerRef.current = setTimeout(() => {
          try {
            rec.start();
            setIsListening(true);
          } catch {
            // ignore
          }
        }, 250);
      }
    };

    recognitionRef.current = rec;
    return () => {
      wantListeningRef.current = false;
      try {
        rec.abort();
      } catch {
        // ignore
      }
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
    };
  }, []);

  // ─── Speech synthesis setup ───
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.getVoices();
    return () => {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    };
  }, []);

  // ─── Listening control ───
  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    finalTranscriptRef.current = "";
    wantListeningRef.current = true;
    try {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        aiSpeakingRef.current = false;
      }
      recognitionRef.current.start();
      setIsListening(true);
    } catch {
      // ignore
    }
  }, []);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    wantListeningRef.current = false;
    try {
      recognitionRef.current.stop();
    } catch {
      // ignore
    }
    setIsListening(false);
  }, []);

  const toggleHandsFree = useCallback(() => {
    setHandsFree((prev) => {
      const next = !prev;
      if (next) {
        if (recognitionRef.current) {
          finalTranscriptRef.current = "";
          wantListeningRef.current = true;
          try {
            recognitionRef.current.start();
            setIsListening(true);
          } catch {
            // ignore
          }
        }
      } else {
        wantListeningRef.current = false;
        try {
          recognitionRef.current?.stop();
        } catch {
          // ignore
        }
        setIsListening(false);
      }
      return next;
    });
  }, []);

  // ─── Speaking control with word-boundary captions ───
  const speak = useCallback((text: string, onProgress?: (charIndex: number) => void) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const clean = text
      .replace(/[*_`#>]/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (!clean) return;
    window.speechSynthesis.cancel();

    onProgressRef.current = onProgress ?? null;

    // PAUSE the mic while speaking
    if (recognitionRef.current && wantListeningRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      setIsListening(false);
    }

    const utter = new SpeechSynthesisUtterance(clean);
    // Conversational tuning — slightly slower, natural pitch
    utter.rate = 0.97;
    utter.pitch = 1.0;
    utter.volume = 1.0;
    const voices = window.speechSynthesis.getVoices();
    // Prefer natural-sounding voices
    const preferred =
      voices.find((v) => /en[-_]?US/i.test(v.lang) && /google us english|samantha|aria|jenny|christopher|david/i.test(v.name)) ||
      voices.find((v) => /en[-_]?GB/i.test(v.lang) && /libby|sonia|ryan/i.test(v.name)) ||
      voices.find((v) => /en[-_]?US/i.test(v.lang)) ||
      voices.find((v) => /^en/i.test(v.lang));
    if (preferred) utter.voice = preferred;

    utter.onstart = () => {
      setIsSpeaking(true);
      aiSpeakingRef.current = true;
      // start at zero progress
      if (onProgressRef.current) onProgressRef.current(0);
    };

    // Word boundary — fires as each word is spoken. This is what gives us
    // real word-by-word caption reveal.
    utter.onboundary = (event: SpeechSynthesisEvent) => {
      if (event.name === "word" || event.name === undefined) {
        if (onProgressRef.current) {
          onProgressRef.current(event.charIndex);
        }
      }
    };

    utter.onend = () => {
      setIsSpeaking(false);
      aiSpeakingRef.current = false;
      // make sure we show the full text at the end
      if (onProgressRef.current) onProgressRef.current(clean.length);
      // RESUME listening after a short pause (hands-free flow)
      if (wantListeningRef.current && handsFreeRef.current) {
        restartTimerRef.current = setTimeout(() => {
          if (recognitionRef.current && wantListeningRef.current && !aiSpeakingRef.current) {
            try {
              recognitionRef.current.start();
              setIsListening(true);
            } catch {
              // ignore
            }
          }
        }, 500);
      }
    };
    utter.onerror = () => {
      setIsSpeaking(false);
      aiSpeakingRef.current = false;
      if (wantListeningRef.current && handsFreeRef.current) {
        restartTimerRef.current = setTimeout(() => {
          if (recognitionRef.current && wantListeningRef.current) {
            try {
              recognitionRef.current.start();
              setIsListening(true);
            } catch {
              // ignore
            }
          }
        }, 500);
      }
    };
    currentUtteranceRef.current = utter;
    window.speechSynthesis.speak(utter);
  }, []);

  const stopSpeaking = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    aiSpeakingRef.current = false;
  }, []);

  return {
    isListening,
    isSpeaking,
    interim,
    supported,
    handsFree,
    startListening,
    stopListening,
    toggleHandsFree,
    speak,
    stopSpeaking,
  };
}
