"use client";

import { usePodcastTour } from "@/hooks/usePodcastTour";
import { useAppStore } from "@/lib/store/useAppStore";
import { Play, Pause, SkipForward, SkipBack, Loader2, Radio, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

/**
 * PodcastTour — pre-generated narration tour UI.
 *
 * Shows a "Start Guided Tour" button when the plant loads. When clicked,
 * it generates a podcast-style narration script via the LLM, renders each
 * segment to audio via Cartesia TTS, then plays them sequentially with
 * the camera following along.
 *
 * The narration is pre-rendered (NotebookLM-style) so there's zero latency
 * during playback and the voice quality is maximum (neural TTS).
 */
export function PodcastTour() {
  const currentPlant = useAppStore((s) => s.currentPlant);
  const { segments, currentSegment, isPlaying, isGenerating, tourReady, generateTour, play, pause, skip, back } = usePodcastTour();
  const [dismissed, setDismissed] = useState(false);

  if (!currentPlant || dismissed) return null;

  // While generating the tour
  if (isGenerating) {
    return (
      <div className="pointer-events-auto absolute left-1/2 top-16 z-20 -translate-x-1/2">
        <div className="flex items-center gap-2.5 rounded-xl border border-sky-500/30 bg-slate-950/90 px-4 py-2.5 shadow-2xl backdrop-blur">
          <Loader2 className="h-4 w-4 animate-spin text-sky-400" />
          <div>
            <div className="text-[12px] font-medium text-slate-200">Preparing your tour…</div>
            <div className="text-[10px] text-slate-500">Generating narration + rendering audio</div>
          </div>
        </div>
      </div>
    );
  }

  // Tour is ready and playing — show playback controls
  if (tourReady) {
    const progress = segments.length > 0 ? ((currentSegment + 1) / segments.length) * 100 : 0;
    return (
      <div className="pointer-events-auto absolute left-1/2 top-16 z-20 -translate-x-1/2">
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950/90 px-4 py-2.5 shadow-2xl backdrop-blur">
          {/* Back */}
          <button
            onClick={back}
            disabled={currentSegment === 0}
            aria-label="Previous segment"
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
            aria-label="Next segment"
            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30"
          >
            <SkipForward className="h-3.5 w-3.5" />
          </button>

          {/* Progress */}
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-medium text-sky-300">
                {currentSegment + 1} / {segments.length}
              </span>
              <div className="h-1 w-24 overflow-hidden rounded-full bg-white/10">
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

          {/* Dismiss */}
          <button
            onClick={() => { pause(); setDismissed(true); }}
            aria-label="Close tour"
            className="flex h-6 w-6 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // Initial state — show "Start Guided Tour" button
  return (
    <div className="pointer-events-auto absolute left-1/2 top-16 z-20 -translate-x-1/2">
      <button
        onClick={generateTour}
        className="flex items-center gap-2.5 rounded-xl border border-sky-500/30 bg-sky-500/10 px-4 py-2.5 shadow-2xl backdrop-blur transition-all hover:border-sky-500/50 hover:bg-sky-500/20"
      >
        <Radio className="h-4 w-4 text-sky-400" />
        <div className="text-left">
          <div className="text-[12px] font-medium text-sky-300">Start Guided Tour</div>
          <div className="text-[9px] text-slate-500">AI narrates while you explore</div>
        </div>
      </button>
    </div>
  );
}
