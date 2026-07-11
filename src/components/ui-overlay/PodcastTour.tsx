"use client";

import { usePodcastTour } from "@/hooks/usePodcastTour";
import { useAppStore } from "@/lib/store/useAppStore";
import { Play, Pause, Loader2, X, CheckCircle2, MessageSquare } from "lucide-react";
import { useState, useEffect } from "react";

/**
 * PodcastTour — video-player style narration tour.
 *
 * Features:
 * - No segment counter (1/17) — just a progress bar like a video scrubber
 * - Streaming subtitle at the bottom of the screen (like watching a video)
 * - AI controls playback: play/pause/skip
 * - After tour: "Tour complete — ask me anything"
 * - The tour is LOCKED (uninterrupted)
 */
export function PodcastTour() {
  const currentPlant = useAppStore((s) => s.currentPlant);
  const { segments, currentSegment, isPlaying, isGenerating, tourReady, tourComplete, play, pause, skip, back } = usePodcastTour();
  const [dismissed, setDismissed] = useState(false);
  const [streamingText, setStreamingText] = useState("");

  if (!currentPlant || dismissed) return null;

  // Loading state
  if (!tourReady && !isGenerating && segments.length === 0) {
    const preGen = typeof window !== "undefined" && (window as any).__preGeneratedTour;
    if (!preGen?.ready) {
      return (
        <div className="pointer-events-auto absolute left-1/2 top-16 z-20 -translate-x-1/2">
          <div className="flex items-center gap-2.5 rounded-xl border border-violet-500/20 bg-slate-950/80 px-3 py-2 shadow-2xl backdrop-blur">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-400" />
            <span className="text-[11px] text-slate-400">Loading tour…</span>
          </div>
        </div>
      );
    }
  }

  if (isGenerating || !tourReady) {
    return (
      <div className="pointer-events-auto absolute left-1/2 top-16 z-20 -translate-x-1/2">
        <div className="flex items-center gap-2.5 rounded-xl border border-sky-500/30 bg-slate-950/90 px-4 py-2.5 shadow-2xl backdrop-blur">
          <Loader2 className="h-4 w-4 animate-spin text-sky-400" />
          <span className="text-[12px] text-slate-200">Preparing tour…</span>
        </div>
      </div>
    );
  }

  const progress = segments.length > 0 ? ((currentSegment + 1) / segments.length) * 100 : 0;
  const currentSeg = segments[currentSegment];

  // Tour complete
  if (tourComplete) {
    return (
      <div className="pointer-events-auto absolute left-1/2 top-16 z-20 -translate-x-1/2">
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-slate-950/90 px-4 py-2.5 shadow-2xl backdrop-blur">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <div className="flex flex-col">
            <span className="text-[12px] font-medium text-emerald-300">Tour complete</span>
            <span className="text-[9px] text-slate-500 flex items-center gap-1">
              <MessageSquare className="h-2.5 w-2.5" /> Ask me anything
            </span>
          </div>
          <button onClick={() => play()} className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-white/10 hover:text-white" title="Replay">
            <Play className="h-3.5 w-3.5 ml-0.5" />
          </button>
          <button onClick={() => setDismissed(true)} className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-white/10 hover:text-white">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // Streaming subtitle effect
  const subtitleText = currentSeg?.text || "";

  return (
    <>
      {/* Subtitle bar — bottom of screen, like video subtitles */}
      {isPlaying && subtitleText && (
        <div className="pointer-events-none absolute bottom-24 left-1/2 z-20 w-full max-w-2xl -translate-x-1/2 px-4">
          <div className="rounded-xl bg-slate-950/80 px-5 py-3 shadow-2xl backdrop-blur">
            <p className="text-center text-[14px] leading-relaxed text-slate-100">
              {subtitleText}
            </p>
          </div>
        </div>
      )}

      {/* Playback controls — top center, minimal */}
      <div className="pointer-events-auto absolute left-1/2 top-16 z-20 -translate-x-1/2">
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950/90 px-4 py-2 shadow-2xl backdrop-blur">
          {/* Play/Pause */}
          <button
            onClick={isPlaying ? pause : play}
            aria-label={isPlaying ? "Pause" : "Play"}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-500 text-white transition-colors hover:bg-sky-400"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
          </button>

          {/* Progress bar — like a video scrubber */}
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-32 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-sky-400 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[9px] text-slate-500">
              {isPlaying ? "playing" : "paused"}
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
      </div>
    </>
  );
}
