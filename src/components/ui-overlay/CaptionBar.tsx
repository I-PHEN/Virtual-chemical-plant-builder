"use client";

import { useAppStore } from "@/lib/store/useAppStore";
import { Volume2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Live caption bar — shows what the AI is currently saying.
 * Compact, editorial, sits above the voice controls.
 */
export function CaptionBar() {
  const caption = useAppStore((s) => s.currentCaption);
  const isSpeaking = useAppStore((s) => s.isAssistantSpeaking);
  const currentPlant = useAppStore((s) => s.currentPlant);

  if (!currentPlant) return null;
  const show = isSpeaking && caption.trim().length > 0;

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
              <p className="text-[13px] leading-relaxed text-slate-200">
                {caption}
              </p>
            </div>
            <div className="mt-1.5 flex items-center gap-1 pl-7">
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.span
                  key={i}
                  className="block w-0.5 rounded-full bg-sky-400/50"
                  animate={{ height: [3, 7, 3] }}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    delay: i * 0.07,
                    ease: "easeInOut",
                  }}
                  style={{ height: 3 }}
                />
              ))}
              <span className="ml-1.5 text-[9px] font-medium uppercase tracking-wider text-sky-400/60">
                AI
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
