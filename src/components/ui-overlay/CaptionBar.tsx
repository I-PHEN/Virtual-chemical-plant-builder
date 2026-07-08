"use client";

import { useAppStore } from "@/lib/store/useAppStore";
import { Volume2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Live caption bar — shows ONLY the words that have been spoken so far.
 * Words appear progressively as the AI speaks them, driven by the
 * SpeechSynthesis boundary event. Nothing is shown ahead of time.
 */
export function CaptionBar() {
  const caption = useAppStore((s) => s.currentCaption);
  const progress = useAppStore((s) => s.captionProgress);
  const isSpeaking = useAppStore((s) => s.isAssistantSpeaking);
  const currentPlant = useAppStore((s) => s.currentPlant);

  if (!currentPlant) return null;
  const show = isSpeaking && caption.trim().length > 0;

  // Only show the portion that has been spoken so far
  const safeProgress = Math.max(0, Math.min(progress, caption.length));
  const spoken = caption.slice(0, safeProgress);

  return (
    <div className="pointer-events-none absolute bottom-24 left-1/2 z-20 w-full max-w-xl -translate-x-1/2 px-4">
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="pointer-events-auto relative overflow-hidden rounded-lg border border-slate-800 bg-slate-950/90 px-3.5 py-2.5 shadow-2xl backdrop-blur"
          >
            <div className="absolute left-0 top-0 h-full w-0.5 bg-sky-400" />
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-sky-500/10 ring-1 ring-sky-500/30">
                <Volume2 className="h-2.5 w-2.5 animate-pulse text-sky-300" />
              </div>
              <p className="min-h-[1.25rem] text-[13px] leading-relaxed text-slate-100">
                {spoken}
                {/* blinking cursor at the end while speaking */}
                <span className="ml-0.5 inline-block h-3 w-0.5 animate-pulse bg-sky-400 align-middle" />
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
