"use client";

import { useAppStore } from "@/lib/store/useAppStore";
import { Volume2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Live caption bar shown at the bottom-center of the screen while the AI
 * is speaking. Displays the text the AI is currently saying so the
 * student can read along — like subtitles on a film.
 */
export function CaptionBar() {
  const caption = useAppStore((s) => s.currentCaption);
  const isSpeaking = useAppStore((s) => s.isAssistantSpeaking);
  const currentPlant = useAppStore((s) => s.currentPlant);

  if (!currentPlant) return null;
  const show = isSpeaking && caption.trim().length > 0;

  return (
    <div className="pointer-events-none absolute bottom-28 left-1/2 z-20 w-full max-w-2xl -translate-x-1/2 px-4">
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="pointer-events-auto relative overflow-hidden rounded-2xl border border-sky-500/25 bg-slate-950/85 px-5 py-3.5 shadow-2xl ring-1 ring-white/5 backdrop-blur-xl"
          >
            {/* animated speaking indicator */}
            <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-sky-400 to-cyan-400" />
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-sky-500/15 ring-1 ring-sky-400/30">
                <Volume2 className="h-3.5 w-3.5 animate-pulse text-sky-300" />
              </div>
              <p className="text-[15px] leading-relaxed text-slate-100">
                {caption}
              </p>
            </div>
            {/* waveform hint */}
            <div className="mt-2 flex items-center gap-1 pl-10">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                <motion.span
                  key={i}
                  className="block w-1 rounded-full bg-sky-400/60"
                  animate={{ height: [4, 10, 4] }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: i * 0.08,
                    ease: "easeInOut",
                  }}
                  style={{ height: 4 }}
                />
              ))}
              <span className="ml-2 text-[10px] font-medium uppercase tracking-wider text-sky-400/70">
                AI speaking
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
