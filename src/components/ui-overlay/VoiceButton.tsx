"use client";

import { Mic, MicOff, Loader2, Volume2, VolumeX, Radio, RadioTower } from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";
import { useVoice } from "@/hooks/useVoice";
import { useCallback, useEffect } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface VoiceButtonProps {
  onTranscript: (text: string) => void;
}

export function VoiceButton({ onTranscript }: VoiceButtonProps) {
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
    handsFree,
    startListening,
    stopListening,
    toggleHandsFree,
    speak,
    stopSpeaking,
  } = useVoice({ onFinalTranscript: onTranscript });

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
    // If hands-free is on, the mic button becomes a manual pause/resume
    if (handsFree) {
      if (isListening) stopListening();
      else startListening();
      return;
    }
    // Push-to-talk: tap to start, tap again to stop
    if (isListening) stopListening();
    else startListening();
  }, [supported.recognition, isListening, handsFree, startListening, stopListening]);

  const handleHandsFreeToggle = useCallback(() => {
    if (!supported.recognition) {
      toast.error("Hands-free mode needs Chrome or Edge for voice input.");
      return;
    }
    toggleHandsFree();
    toast.success(
      !handsFree
        ? "Hands-free mode on. Just talk — I'll listen and reply automatically."
        : "Hands-free mode off."
    );
  }, [supported.recognition, handsFree, toggleHandsFree]);

  const handleMuteClick = useCallback(() => {
    if (voiceEnabled) {
      stopSpeaking();
      setVoiceEnabled(false);
    } else {
      setVoiceEnabled(true);
    }
  }, [voiceEnabled, stopSpeaking, setVoiceEnabled]);

  // expose speak/stopSpeak globally so the chat handler can call them
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
        <div className="mb-2 max-w-xs rounded-xl bg-slate-900/90 px-4 py-2.5 text-sm text-white shadow-2xl ring-1 ring-sky-400/50 backdrop-blur">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-sky-300">
            {handsFree ? "Listening (hands-free)…" : "Listening…"}
          </span>
          <div className="mt-1 leading-relaxed">{interim}</div>
        </div>
      )}

      <div className="flex items-center gap-2.5">
        {/* hands-free toggle */}
        <button
          onClick={handleHandsFreeToggle}
          disabled={!currentPlant}
          aria-label={handsFree ? "Turn off hands-free mode" : "Turn on hands-free mode"}
          title={handsFree ? "Hands-free ON — just talk" : "Hands-free OFF — tap mic to speak"}
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-full shadow-lg transition-all",
            "disabled:cursor-not-allowed disabled:opacity-40",
            handsFree
              ? "bg-emerald-500 text-white ring-2 ring-emerald-300/50"
              : "bg-slate-800/90 text-slate-300 hover:bg-slate-700"
          )}
        >
          {handsFree ? <RadioTower className="h-5 w-5" /> : <Radio className="h-5 w-5" />}
        </button>

        {/* main mic button */}
        <button
          onClick={handleMicClick}
          disabled={!currentPlant}
          aria-label={isListening ? "Stop listening" : "Start voice input"}
          className={cn(
            "relative flex h-16 w-16 items-center justify-center rounded-full shadow-2xl transition-all duration-200",
            "disabled:cursor-not-allowed disabled:opacity-40",
            isListening
              ? "bg-rose-500 text-white scale-110"
              : handsFree
              ? "bg-emerald-500 text-white hover:bg-emerald-400"
              : "bg-sky-500 text-white hover:bg-sky-400 hover:scale-105"
          )}
        >
          {isListening ? (
            <>
              <span className="absolute inset-0 animate-ping rounded-full bg-rose-400 opacity-40" />
              <span className="absolute inset-[-6px] animate-pulse rounded-full bg-rose-500/20" />
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
          title={voiceEnabled ? "AI voice on" : "AI voice muted"}
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-full shadow-lg transition-all",
            voiceEnabled
              ? "bg-slate-800/90 text-sky-300 hover:bg-slate-700"
              : "bg-slate-800/90 text-slate-500 hover:bg-slate-700"
          )}
        >
          {voiceEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
        </button>
      </div>

      {/* status text */}
      <div className="text-xs font-medium text-slate-300">
        {isSpeaking ? (
          <span className="flex items-center gap-1.5 text-sky-300">
            <Volume2 className="h-3 w-3 animate-pulse" /> AI speaking…
          </span>
        ) : isListening ? (
          <span className="flex items-center gap-1.5 text-rose-300">
            <Loader2 className="h-3 w-3 animate-spin" />
            {handsFree ? "Listening — just talk" : "Listening…"}
          </span>
        ) : handsFree ? (
          <span className="flex items-center gap-1.5 text-emerald-300">
            <RadioTower className="h-3 w-3" /> Hands-free ready
          </span>
        ) : (
          <span className="text-slate-400">Tap mic or enable hands-free</span>
        )}
      </div>
    </div>
  );
}
