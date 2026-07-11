"use client";

import { usePodcastTour } from "@/hooks/usePodcastTour";
import { useAppStore } from "@/lib/store/useAppStore";
import { Play, Pause, SkipForward, SkipBack, Loader2, X, CheckCircle2, MessageSquare } from "lucide-react";
import { useState } from "react";

/**
 * PodcastTour — pre-generated narration tour UI.
 *
 * The tour is LOCKED (uninterrupted). After it finishes, the UI shows
 * "Tour complete — ask me anything" and the user can use the chat/voice
 * to ask questions.
 *
 * Shows the transcript of the current segment alongside the audio.
 */
export function PodcastTour() {
  const currentPlant = useAppStore((s) => s.currentPlant);
  const { segments, currentSegment, isPlaying, isGenerating, tourReady, tourComplete, play, pause, skip, back } = usePodcastTour();
  const [dismissed, setDismissed] = useState(false);

  if (!currentPlant || dismissed) return null;

  // Loading state — waiting for pre-generated tour from chat build phase
  if (!tourReady && !isGenerating && segments.length === 0) {
    const preGen = typeof window !== "undefined" && (window as any).__preGeneratedTour;
    if (!preGen?.ready) {
      return (
        <div className="pointer-events-auto absolute left-1/2 top-16 z-20 -translate-x-1/2">
          <div className="flex items-center gap-2.5 rounded-xl border border-violet-500/20 bg-slate-950/80 px-3 py-2 shadow-2xl backdrop-blur">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-400" />
            <span className="text-[11px] text-slate-400">Loading tour audio…</span>
          </div>
        </div>
      );
    }
  }

  if (isGenerating) {
    return (
      <div className="pointer-events-auto absolute left-1/2 top-16 z-20 -translate-x-1/2">
        <div className="flex items-center gap-2.5 rounded-xl border border-sky-500/30 bg-slate-950/90 px-4 py-2.5 shadow-2xl backdrop-blur">
          <Loader2 className="h-4 w-4 animate-spin text-sky-400" />
          <span className="text-[12px] text-slate-200">Preparing your tour…</span>
        </div>
      </div>
    );
  }

  if (!tourReady) return null;

  const progress = segments.length > 0 ? ((currentSegment + 1) / segments.length) * 100 : 0;
  const currentSeg = segments[currentSegment];

  // Tour complete — show "ask me anything" state
  if (tourComplete) {
    return (
      <div className="pointer-events-auto absolute left-1/2 top-16 z-20 -translate-x-1/2">
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-slate-950/90 px-4 py-2.5 shadow-2xl backdrop-blur">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <div className="flex flex-col">
            <span className="text-[12px] font-medium text-emerald-300">Tour complete</span>
            <span className="text-[9px] text-slate-500 flex items-center gap-1">
              <MessageSquare className="h-2.5 w-2.5" /> Ask me anything — use the chat or mic
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => { play(); }}
              aria-label="Replay tour"
              className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
              title="Replay tour"
            >
              <Play className="h-3.5 w-3.5 ml-0.5" />
            </button>
            <button
              onClick={() => setDismissed(true)}
              aria-label="Close"
              className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Tour playing — playback controls + transcript
  return (
    <div className="pointer-events-auto absolute left-1/2 top-16 z-20 w-[420px] max-w-[90vw] -translate-x-1/2">
      <div className="rounded-xl border border-white/10 bg-slate-950/90 shadow-2xl backdrop-blur">
        {/* Top row: controls */}
        <div className="flex items-center gap-3 px-4 py-2.5">
          {/* Back */}
          <button
            onClick={back}
            disabled={currentSegment === 0}
            aria-label="Previous"
            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30"
          >
            <SkipBack className="h-3.5 w-3.5" />
          </button>

          {/* Play/Pause */}
          <button
            onClick={isPlaying ? pause : play}
            aria-label={isPlaying ? "Pause" : "Play"}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-500 text-white transition-colors hover:bg-sky-400"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
          </button>

          {/* Skip */}
          <button
            onClick={skip}
            disabled={currentSegment >= segments.length - 1}
            aria-label="Next"
            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30"
          >
            <SkipForward className="h-3.5 w-3.5" />
          </button>

          {/* Progress */}
          <div className="flex flex-1 flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-medium text-sky-300">
                {currentSegment + 1} / {segments.length}
              </span>
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-sky-400 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <span className="text-[9px] text-slate-500">
              {isPlaying ? "Narrating…" : "Paused"}
            </span>
          </div>

          {/* Close */}
          <button
            onClick={() => { pause(); setDismissed(true); }}
            aria-label="Close tour"
            className="flex h-6 w-6 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Bottom row: transcript of current segment */}
        {currentSeg?.text && (
          <div className="border-t border-white/5 px-4 py-2">
            <p className="text-[11px] leading-relaxed text-slate-300">
              {currentSeg.text}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
