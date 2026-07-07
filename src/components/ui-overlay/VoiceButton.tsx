"use client";

import { Mic, MicOff, Loader2, Volume2, VolumeX } from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";
import { useVoice } from "@/hooks/useVoice";
import { useCallback, useEffect } from "react";
import { toast } from "sonner";

interface VoiceButtonProps {
  onTranscript: (text: string) => void;
}

export function VoiceButton({ onTranscript }: VoiceButtonProps) {
  const isAssistantSpeaking = useAppStore((s) => s.isAssistantSpeaking);
  const setAssistantSpeaking = useAppStore((s) => s.setAssistantSpeaking);
  const setListening = useAppStore((s) => s.setListening);
  const voiceEnabled = useAppStore((s) => s.voiceEnabled);
  const setVoiceEnabled = useAppStore((s) => s.setVoiceEnabled);
  const currentPlant = useAppStore((s) => s.currentPlant);

  const {
    isListening,
    isSpeaking,
    interim,
    supported,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  } = useVoice({ onFinalTranscript: onTranscript });

  // sync to store so other components can react
  useEffect(() => {
    setListening(isListening);
  }, [isListening, setListening]);
  useEffect(() => {
    setAssistantSpeaking(isSpeaking);
  }, [isSpeaking, setAssistantSpeaking]);

  const handleMicClick = useCallback(() => {
    if (!supported.recognition) {
      toast.error(
        "Voice input isn't supported in this browser. Try Chrome or Edge — you can still type below."
      );
      return;
    }
    if (isListening) stopListening();
    else startListening();
  }, [supported.recognition, isListening, startListening, stopListening]);

  const handleMuteClick = useCallback(() => {
    if (voiceEnabled) {
      stopSpeaking();
      setVoiceEnabled(false);
    } else {
      setVoiceEnabled(true);
    }
  }, [voiceEnabled, stopSpeaking, setVoiceEnabled]);

  // speak an intro when a plant is first loaded (handled by parent via store)
  // expose speak to parent through store? Instead, parent passes callback.
  // We provide speak through a global so the chat handler can call it.
  useEffect(() => {
    (window as any).__plantSpeak = (text: string) => {
      if (voiceEnabled) speak(text);
    };
    (window as any).__plantStopSpeak = () => stopSpeaking();
    return () => {
      delete (window as any).__plantSpeak;
      delete (window as any).__plantStopSpeak;
    };
  }, [voiceEnabled, speak, stopSpeaking]);

  return (
    <div className="pointer-events-auto flex flex-col items-center gap-2">
      {/* interim transcript bubble */}
      {isListening && interim && (
        <div className="mb-2 max-w-xs rounded-lg bg-slate-900/90 px-3 py-2 text-sm text-white shadow-lg ring-1 ring-sky-400/40">
          <span className="text-sky-300">listening…</span>
          <div className="mt-1">{interim}</div>
        </div>
      )}

      <div className="flex items-center gap-3">
        {/* mic button */}
        <button
          onClick={handleMicClick}
          disabled={!currentPlant}
          aria-label={isListening ? "Stop listening" : "Start voice input"}
          className={[
            "relative flex h-16 w-16 items-center justify-center rounded-full shadow-xl transition-all duration-200",
            "disabled:cursor-not-allowed disabled:opacity-40",
            isListening
              ? "bg-rose-500 text-white scale-110"
              : "bg-sky-500 text-white hover:bg-sky-400 hover:scale-105",
          ].join(" ")}
        >
          {isListening ? (
            <>
              {/* pulsing rings */}
              <span className="absolute inset-0 animate-ping rounded-full bg-rose-400 opacity-40" />
              <MicOff className="h-6 w-6 relative" />
            </>
          ) : (
            <Mic className="h-6 w-6" />
          )}
        </button>

        {/* mute toggle */}
        <button
          onClick={handleMuteClick}
          aria-label={voiceEnabled ? "Mute AI voice" : "Unmute AI voice"}
          className={[
            "flex h-11 w-11 items-center justify-center rounded-full shadow-lg transition-all",
            voiceEnabled
              ? "bg-slate-800 text-sky-300 hover:bg-slate-700"
              : "bg-slate-800 text-slate-500 hover:bg-slate-700",
          ].join(" ")}
        >
          {voiceEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
        </button>
      </div>

      {/* status text */}
      <div className="text-xs font-medium text-slate-300">
        {isAssistantSpeaking ? (
          <span className="flex items-center gap-1">
            <Volume2 className="h-3 w-3 animate-pulse" /> AI speaking…
          </span>
        ) : isListening ? (
          <span className="flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" /> Listening…
          </span>
        ) : (
          <span>Tap mic or type to speak</span>
        )}
      </div>
    </div>
  );
}
