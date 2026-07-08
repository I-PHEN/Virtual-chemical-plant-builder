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
  const handsFreeRef = useRef(true);
  const aiSpeakingRef = useRef(false);
  const wantListeningRef = useRef(false);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      // INTERRUPT: if the user starts speaking while AI is talking, cut the AI off
      if (interimText.length > 0 && aiSpeakingRef.current) {
        if (currentAudioRef.current) {
          currentAudioRef.current.pause();
          currentAudioRef.current = null;
        }
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          window.speechSynthesis.cancel();
        }
        setIsSpeaking(false);
        aiSpeakingRef.current = false;
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
  // Tries server-side neural TTS first (better quality), falls back to
  // browser SpeechSynthesis if the server is unavailable.
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const useServerTTSRef = useRef<boolean | null>(null); // null = not tested yet

  const speakWithBrowserTTS = (clean: string, onProgress?: (charIndex: number) => void) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    const doSpeak = () => {
      const utter = new SpeechSynthesisUtterance(clean);
      utter.rate = 1.0;
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
        if (onProgress) onProgress(0);
      };
      utter.onboundary = (event: SpeechSynthesisEvent) => {
        if (event.name === "word" || event.name === undefined) {
          if (onProgress) onProgress(event.charIndex);
        }
      };
      utter.onend = () => {
        setIsSpeaking(false);
        aiSpeakingRef.current = false;
        if (onProgress) onProgress(clean.length);
        resumeListeningAfterSpeech();
      };
      utter.onerror = () => {
        setIsSpeaking(false);
        aiSpeakingRef.current = false;
        resumeListeningAfterSpeech();
      };
      window.speechSynthesis.speak(utter);
    };

    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) {
      let retries = 0;
      const waitAndSpeak = () => {
        const v = window.speechSynthesis.getVoices();
        if (v.length > 0 || retries >= 10) doSpeak();
        else { retries++; setTimeout(waitAndSpeak, 100); }
      };
      setTimeout(waitAndSpeak, 150);
    } else {
      setTimeout(doSpeak, 50);
    }
  };

  const speakWithServerTTS = async (clean: string, onProgress?: (charIndex: number) => void) => {
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: clean }),
      });

      if (!res.ok) throw new Error("TTS failed");

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("audio")) {
        // Server returned JSON (fallback signal)
        useServerTTSRef.current = false;
        speakWithBrowserTTS(clean, onProgress);
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      currentAudioRef.current = audio;

      // Simulate word-by-word progress for captions since server TTS
      // doesn't fire boundary events. We split by words and advance
      // based on audio time.
      const words = clean.split(/\s+/);
      let charCount = 0;
      const wordBoundaries: number[] = [];
      for (const w of words) {
        wordBoundaries.push(charCount);
        charCount += w.length + 1;
      }

      audio.onplay = () => {
        setIsSpeaking(true);
        aiSpeakingRef.current = true;
        if (onProgress) onProgress(0);
      };

      // Update caption progress based on audio currentTime
      audio.ontimeupdate = () => {
        if (!onProgress || !audio.duration) return;
        const ratio = audio.currentTime / audio.duration;
        const wordIdx = Math.floor(ratio * words.length);
        const charIdx = wordBoundaries[Math.min(wordIdx, wordBoundaries.length - 1)] ?? 0;
        onProgress(charIdx);
      };

      audio.onended = () => {
        setIsSpeaking(false);
        aiSpeakingRef.current = false;
        if (onProgress) onProgress(clean.length);
        URL.revokeObjectURL(url);
        currentAudioRef.current = null;
        resumeListeningAfterSpeech();
      };

      audio.onerror = () => {
        setIsSpeaking(false);
        aiSpeakingRef.current = false;
        URL.revokeObjectURL(url);
        currentAudioRef.current = null;
        // Fall back to browser TTS
        speakWithBrowserTTS(clean, onProgress);
      };

      await audio.play();
      useServerTTSRef.current = true;
    } catch (err) {
      console.error("[voice] server TTS failed, falling back", err);
      useServerTTSRef.current = false;
      speakWithBrowserTTS(clean, onProgress);
    }
  };

  const resumeListeningAfterSpeech = () => {
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
      }, 400);
    }
  };

  const speak = useCallback((text: string, onProgress?: (charIndex: number) => void) => {
    if (typeof window === "undefined") return;
    const clean = text
      .replace(/[*_`#>]/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (!clean) return;

    // Stop any current audio
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();

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

    // Use server TTS if we haven't tested it yet, or if it worked before
    if (useServerTTSRef.current === null || useServerTTSRef.current === true) {
      speakWithServerTTS(clean, onProgress);
    } else {
      speakWithBrowserTTS(clean, onProgress);
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
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
