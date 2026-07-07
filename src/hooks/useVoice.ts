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
 *    after the AI finishes. This gives a natural conversational flow
 *    without the user ever pressing a button.
 */

interface UseVoiceOptions {
  onFinalTranscript?: (text: string) => void;
  onAISpeakingChange?: (speaking: boolean) => void;
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
  const handsFreeRef = useRef(false);
  const aiSpeakingRef = useRef(false);
  const wantListeningRef = useRef(false); // what the user wants
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    onFinalRef.current = onFinalTranscript;
  }, [onFinalTranscript]);

  // keep refs in sync
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
    rec.continuous = true;       // keep listening across pauses
    rec.interimResults = true;   // show partial transcripts
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
      // "no-speech" and "aborted" are normal in continuous mode — don't log noisy
      if (event.error !== "no-speech" && event.error !== "aborted") {
        console.warn("[voice] recognition error", event.error);
      }
      // On errors like "network", we still try to restart if hands-free wants it
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

      // Auto-restart if user wants to keep listening (hands-free) and AI is not speaking
      if (wantListeningRef.current && !aiSpeakingRef.current && handsFreeRef.current) {
        // small delay to avoid tight loop
        restartTimerRef.current = setTimeout(() => {
          try {
            rec.start();
            setIsListening(true);
          } catch {
            // already started or other transient issue — will retry on next cycle
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
      // cancel any ongoing speech so the mic can hear clearly
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        aiSpeakingRef.current = false;
      }
      recognitionRef.current.start();
      setIsListening(true);
    } catch (e) {
      // can throw if already started — that's fine
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
        // turn hands-free on → start listening
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
        // turn hands-free off → stop listening
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

  // ─── Speaking control ───
  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const clean = text
      .replace(/[*_`#>]/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (!clean) return;
    window.speechSynthesis.cancel();

    // PAUSE the mic while speaking so it doesn't hear the AI
    if (recognitionRef.current && wantListeningRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      setIsListening(false);
    }

    const utter = new SpeechSynthesisUtterance(clean);
    utter.rate = 1.02;
    utter.pitch = 1.0;
    utter.volume = 1.0;
    const voices = window.speechSynthesis.getVoices();
    const preferred =
      voices.find((v) => /en[-_]?US/i.test(v.lang) && /female|samantha|google|aria|jenny/i.test(v.name)) ||
      voices.find((v) => /en[-_]?GB/i.test(v.lang) && /female|libby|sonia/i.test(v.name)) ||
      voices.find((v) => /en[-_]?US/i.test(v.lang)) ||
      voices.find((v) => /^en/i.test(v.lang));
    if (preferred) utter.voice = preferred;

    utter.onstart = () => {
      setIsSpeaking(true);
      aiSpeakingRef.current = true;
    };
    utter.onend = () => {
      setIsSpeaking(false);
      aiSpeakingRef.current = false;
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
      // also try to resume listening on error
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
