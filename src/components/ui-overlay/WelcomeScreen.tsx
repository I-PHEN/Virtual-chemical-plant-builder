"use client";

import { useState } from "react";
import { Loader2, Factory, FlaskConical, Wind, Wine, Sparkles, Mic } from "lucide-react";
import { PLANT_TEMPLATES } from "@/lib/plant/templates";
import { useAppStore } from "@/lib/store/useAppStore";
import { cn } from "@/lib/utils";

interface WelcomeScreenProps {
  onBuild: (command: string) => void;
}

const ICONS: Record<string, React.ReactNode> = {
  ammonia: <Factory className="h-6 w-6" />,
  distillation: <FlaskConical className="h-6 w-6" />,
  "sulfuric-acid": <Wind className="h-6 w-6" />,
  ethanol: <Wine className="h-6 w-6" />,
};

const ACCENT: Record<string, string> = {
  ammonia: "#3b82f6",
  distillation: "#8b5cf6",
  "sulfuric-acid": "#ef4444",
  ethanol: "#10b981",
};

export function WelcomeScreen({ onBuild }: WelcomeScreenProps) {
  const isGenerating = useAppStore((s) => s.isGenerating);
  const [command, setCommand] = useState("");

  const handleCommand = (text: string) => {
    if (isGenerating) return;
    onBuild(text.trim());
  };

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center overflow-y-auto bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-8">
      {/* ambient glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-500/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute right-1/4 bottom-1/4 h-60 w-60 rounded-full bg-violet-500/15 blur-3xl"
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-3xl text-center">
        {/* badge */}
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-xs text-sky-300">
          <Sparkles className="h-3.5 w-3.5" />
          AI-native Chemical Engineering Learning Platform
        </div>

        {/* title */}
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
          AI Chemical Plant <span className="text-sky-400">Explorer</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-slate-300">
          Speak or type a plant to build. Within seconds, an AI assembles an interactive 3D plant you can walk through, click, and converse with — like having a process engineer by your side.
        </p>

        {/* command input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleCommand(command);
          }}
          className="mx-auto mt-7 flex max-w-xl gap-2"
        >
          <div className="relative flex-1">
            <input
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder='Try: "Build an ammonia plant"'
              disabled={isGenerating}
              className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 pl-11 text-white placeholder:text-slate-500 shadow-lg outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 disabled:opacity-50"
            />
            <Mic className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-sky-400" />
          </div>
          <button
            type="submit"
            disabled={isGenerating || !command.trim()}
            className={cn(
              "flex items-center gap-2 rounded-xl bg-sky-500 px-5 py-3 font-semibold text-white shadow-lg transition-all",
              "hover:bg-sky-400 hover:shadow-sky-500/30 disabled:cursor-not-allowed disabled:opacity-50"
            )}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> Building…
              </>
            ) : (
              <>Build</>
            )}
          </button>
        </form>

        {/* template cards */}
        <div className="mt-8 text-left">
          <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            or pick a plant
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {PLANT_TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => handleCommand(`Build a ${tpl.name.toLowerCase().split(" ")[0]} plant`)}
                disabled={isGenerating}
                className={cn(
                  "group flex items-start gap-3 rounded-xl border border-slate-700/70 bg-slate-900/60 p-4 text-left transition-all",
                  "hover:border-sky-500/50 hover:bg-slate-800/70 disabled:cursor-not-allowed disabled:opacity-50"
                )}
              >
                <div
                  className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg"
                  style={{ background: `${ACCENT[tpl.id]}22`, color: ACCENT[tpl.id] }}
                >
                  {ICONS[tpl.id]}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white">{tpl.name}</div>
                  <div className="mt-0.5 line-clamp-2 text-xs text-slate-400">{tpl.tagline}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <p className="mt-8 text-xs text-slate-500">
          Tip: tap the mic and say “take me to the reactor”, “hide valves”, or “quiz me”.
        </p>
      </div>
    </div>
  );
}
