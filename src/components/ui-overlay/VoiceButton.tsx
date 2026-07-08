"use client";

import { Mic, MicOff, Loader2, Volume2, VolumeX, RadioTower, Radio } from "lucide-react";
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
  const setCaptionProgress = useAppStore((s) => s.setCaptionProgress);
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
      toast.error("Voice input needs Chrome or Edge. You can still type.");
      return;
    }
    if (isListening) stopListening();
    else startListening();
  }, [supported.recognition, isListening, startListening, stopListening]);

  const handleHandsFreeToggle = useCallback(() => {
    if (!supported.recognition) {
      toast.error("Hands-free mode needs Chrome or Edge.");
      return;
    }
    toggleHandsFree();
    toast.success(
      !handsFree
        ? "Hands-free on. Just talk."
        : "Hands-free off."
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

  useEffect(() => {
    (window as any).__plantSpeak = (text: string) => {
      if (voiceEnabled) speak(text, (charIndex) => setCaptionProgress(charIndex));
    };
    (window as any).__plantStopSpeak = () => stopSpeaking();
    return () => {
      delete (window as any).__plantSpeak;
      delete (window as any).__plantStopSpeak;
    };
  }, [voiceEnabled, speak, stopSpeaking, setCaptionProgress]);

  return (
    <div className="pointer-events-auto flex flex-col items-center gap-1.5">
      {/* interim transcript bubble */}
      {isListening && interim && (
        <div className="mb-1.5 max-w-xs rounded-lg border border-slate-800 bg-slate-950/90 px-3 py-2 text-[12px] text-slate-100 shadow-xl backdrop-blur">
          <span className="text-[9px] font-medium uppercase tracking-wider text-sky-400">
            {handsFree ? "listening" : "listening"}
          </span>
          <div className="mt-0.5 leading-relaxed">{interim}</div>
        </div>
      )}

      <div className="flex items-center gap-1.5">
        {/* hands-free toggle */}
        <button
          onClick={handleHandsFreeToggle}
          disabled={!currentPlant}
          aria-label={handsFree ? "Turn off hands-free" : "Turn on hands-free"}
          title={handsFree ? "Hands-free ON" : "Hands-free OFF"}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full border transition-all",
            "disabled:opacity-40",
            handsFree
              ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
              : "border-slate-800 bg-slate-950/60 text-slate-400 hover:bg-slate-900 hover:text-slate-200"
          )}
        >
          {handsFree ? <RadioTower className="h-3.5 w-3.5" /> : <Radio className="h-3.5 w-3.5" />}
        </button>

        {/* main mic */}
        <button
          onClick={handleMicClick}
          disabled={!currentPlant}
          aria-label={isListening ? "Stop listening" : "Start voice input"}
          className={cn(
            "relative flex h-12 w-12 items-center justify-center rounded-full border transition-all",
            "disabled:opacity-40",
            isListening
              ? "border-rose-500/50 bg-rose-500 text-white"
              : handsFree
              ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"
              : "border-slate-700 bg-slate-100 text-slate-900 hover:bg-white"
          )}
        >
          {isListening && (
            <span className="absolute inset-0 animate-ping rounded-full bg-rose-500/40" />
          )}
          {isListening ? <MicOff className="h-4 w-4 relative" /> : <Mic className="h-4 w-4 relative" />}
        </button>

        {/* mute */}
        <button
          onClick={handleMuteClick}
          aria-label={voiceEnabled ? "Mute AI" : "Unmute AI"}
          title={voiceEnabled ? "Voice on" : "Voice muted"}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full border transition-all",
            voiceEnabled
              ? "border-slate-800 bg-slate-950/60 text-slate-300 hover:bg-slate-900"
              : "border-slate-800 bg-slate-950/60 text-slate-600 hover:bg-slate-900"
          )}
        >
          {voiceEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* status — tiny */}
      <div className="text-[10px] font-medium text-slate-500">
        {isSpeaking ? (
          <span className="flex items-center gap-1 text-sky-300">
            <Volume2 className="h-2.5 w-2.5 animate-pulse" /> speaking
          </span>
        ) : isListening ? (
          <span className="flex items-center gap-1 text-rose-300">
            <Loader2 className="h-2.5 w-2.5 animate-spin" /> {handsFree ? "listening" : "listening"}
          </span>
        ) : handsFree ? (
          <span className="flex items-center gap-1 text-emerald-300">
            <RadioTower className="h-2.5 w-2.5" /> hands-free
          </span>
        ) : (
          <span>tap mic or hands-free</span>
        )}
      </div>
    </div>
  );
}
