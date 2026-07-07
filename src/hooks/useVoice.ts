"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useVoice — wraps the browser Web Speech API for speech-to-text and
 * the SpeechSynthesis API for text-to-speech. Falls back gracefully on
 * browsers that do not support these APIs.
 */

type SpeechRecognitionType = typeof window extends { SpeechRecognition: infer T }
  ? T
  : any;

interface UseVoiceOptions {
  onFinalTranscript?: (text: string) => void;
}

export function useVoice(options: UseVoiceOptions = {}) {
  const { onFinalTranscript } = options;

  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [interim, setInterim] = useState("");
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
  useEffect(() => {
    onFinalRef.current = onFinalTranscript;
  }, [onFinalTranscript]);

  // Init speech recognition
  useEffect(() => {
    if (typeof window === "undefined") return;
    const SR =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      return;
    }
    const rec = new SR();
    rec.continuous = false;
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
      console.warn("[voice] recognition error", event.error);
      setIsListening(false);
      setInterim("");
    };

    rec.onend = () => {
      setIsListening(false);
      setInterim("");
      const final = finalTranscriptRef.current.trim();
      finalTranscriptRef.current = "";
      if (final && onFinalRef.current) onFinalRef.current(final);
    };

    recognitionRef.current = rec;
    return () => {
      try {
        rec.abort();
      } catch {
        // ignore
      }
    };
  }, []);

  // Init speech synthesis (warm up voices)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("speechSynthesis" in window)) return;
    // warm up voices (Chrome loads them async)
    window.speechSynthesis.getVoices();
    return () => {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    };
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    finalTranscriptRef.current = "";
    try {
      // cancel any ongoing speech so the mic can hear clearly
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
      recognitionRef.current.start();
      setIsListening(true);
    } catch (e) {
      // can throw if already started
      console.warn("[voice] start error", e);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch {
      // ignore
    }
    setIsListening(false);
  }, []);

  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    // strip non-spoken characters
    const clean = text
      .replace(/[*_`#>]/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (!clean) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(clean);
    utter.rate = 1.0;
    utter.pitch = 1.0;
    utter.volume = 1.0;
    // Try to pick a pleasant English voice
    const voices = window.speechSynthesis.getVoices();
    const preferred =
      voices.find((v) => /en[-_]?US/i.test(v.lang) && /female|samantha|google/i.test(v.name)) ||
      voices.find((v) => /en[-_]?US/i.test(v.lang)) ||
      voices.find((v) => /^en/i.test(v.lang));
    if (preferred) utter.voice = preferred;
    utter.onstart = () => setIsSpeaking(true);
    utter.onend = () => setIsSpeaking(false);
    utter.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utter);
  }, []);

  const stopSpeaking = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  return {
    isListening,
    isSpeaking,
    interim,
    supported,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  };
}
