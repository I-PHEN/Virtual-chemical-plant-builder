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
  const [handsFree, setHandsFree] = useState(true); // DEFAULT ON — zero friction
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

  // Auto-start listening when a plant is loaded (hands-free is on by default)
  // This is triggered by the VoiceButton component which has access to currentPlant
  useEffect(() => {
    if (!handsFree) return;
    // Don't auto-start here — the VoiceButton will call startListening
    // when the plant loads. This effect just keeps the ref in sync.
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

    // Force-load voices. Chrome loads them asynchronously, so we need to
    // call getVoices() and also listen for the voiceschanged event.
    const loadVoices = () => {
      window.speechSynthesis.getVoices();
    };
    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);

    // Some browsers need a "warm-up" utterance to unlock speech synthesis
    // after a user gesture. We do a silent 0-length utterance on first
    // interaction.
    const warmUp = () => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      try {
        const u = new SpeechSynthesisUtterance("");
        u.volume = 0;
        window.speechSynthesis.speak(u);
      } catch {
        // ignore
      }
      // remove after first interaction
      window.removeEventListener("click", warmUp);
      window.removeEventListener("keydown", warmUp);
      window.removeEventListener("touchstart", warmUp);
    };
    window.addEventListener("click", warmUp);
    window.addEventListener("keydown", warmUp);
    window.addEventListener("touchstart", warmUp);

    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
      window.removeEventListener("click", warmUp);
      window.removeEventListener("keydown", warmUp);
      window.removeEventListener("touchstart", warmUp);
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

    // Cancel any ongoing speech
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

    // Ensure voices are loaded before speaking
    const voices = window.speechSynthesis.getVoices();

    const doSpeak = () => {
      const utter = new SpeechSynthesisUtterance(clean);
      utter.rate = 0.97;
      utter.pitch = 1.0;
      utter.volume = 1.0;
      const v = window.speechSynthesis.getVoices();
      const preferred =
        v.find((voice) => /en[-_]?US/i.test(voice.lang) && /google us english|samantha|aria|jenny|christopher|david/i.test(voice.name)) ||
        v.find((voice) => /en[-_]?GB/i.test(voice.lang) && /libby|sonia|ryan/i.test(voice.name)) ||
        v.find((voice) => /en[-_]?US/i.test(voice.lang)) ||
        v.find((voice) => /^en/i.test(voice.lang));
      if (preferred) utter.voice = preferred;

      utter.onstart = () => {
        setIsSpeaking(true);
        aiSpeakingRef.current = true;
        if (onProgressRef.current) onProgressRef.current(0);
      };

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
        if (onProgressRef.current) onProgressRef.current(clean.length);
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
    };

    // If voices aren't loaded yet, wait a bit and retry
    if (voices.length === 0) {
      let retries = 0;
      const waitAndSpeak = () => {
        const v = window.speechSynthesis.getVoices();
        if (v.length > 0 || retries >= 10) {
          doSpeak();
        } else {
          retries++;
          setTimeout(waitAndSpeak, 100);
        }
      };
      setTimeout(waitAndSpeak, 150);
    } else {
      // Small delay to ensure cancel() has completed
      setTimeout(doSpeak, 50);
    }
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
