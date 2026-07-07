"use client";

import { useState } from "react";
import { Loader2, Factory, FlaskConical, Wind, Wine, Sparkles, Mic, ArrowRight } from "lucide-react";
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
  distillation: "#a855f7",
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
    <div className="absolute inset-0 z-30 flex items-center justify-center overflow-y-auto bg-slate-950 px-4 py-8">
      {/* layered ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(56,189,248,0.12),_transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(167,139,250,0.10),_transparent_55%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(56,189,248,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.025)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl text-center">
        {/* badge */}
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-4 py-1.5 text-xs font-medium text-sky-300 backdrop-blur">
          <Sparkles className="h-3.5 w-3.5" />
          AI-native Chemical Engineering Learning Platform
        </div>

        {/* title */}
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
          AI Chemical Plant{" "}
          <span className="bg-gradient-to-r from-sky-400 via-cyan-300 to-violet-400 bg-clip-text text-transparent">
            Explorer
          </span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
          Speak or type a plant to build. Within seconds an AI assembles an
          interactive 3D plant you can walk through, click, and converse with —
          like having a process engineer by your side.
        </p>

        {/* command input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleCommand(command);
          }}
          className="mx-auto mt-8 flex max-w-xl gap-2"
        >
          <div className="relative flex-1">
            <input
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder='Try: "Build an ammonia plant"'
              disabled={isGenerating}
              className="w-full rounded-xl border border-slate-700/80 bg-slate-900/70 px-4 py-3.5 pl-12 text-white placeholder:text-slate-500 shadow-2xl outline-none backdrop-blur transition-colors focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/30 disabled:opacity-50"
            />
            <Mic className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-sky-400" />
          </div>
          <button
            type="submit"
            disabled={isGenerating || !command.trim()}
            className={cn(
              "flex items-center gap-2 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500 px-6 py-3.5 font-semibold text-white shadow-2xl shadow-sky-500/25 transition-all",
              "hover:from-sky-400 hover:to-cyan-400 hover:shadow-sky-500/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:from-sky-500 disabled:hover:to-cyan-500"
            )}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> Building…
              </>
            ) : (
              <>
                Build <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* template cards */}
        <div className="mt-9 text-left">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            or pick a plant
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {PLANT_TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => handleCommand(`Build a ${tpl.name.toLowerCase().split(" ")[0]} plant`)}
                disabled={isGenerating}
                className={cn(
                  "group relative flex items-start gap-3 overflow-hidden rounded-xl border border-slate-700/70 bg-slate-900/50 p-4 text-left backdrop-blur transition-all",
                  "hover:border-sky-500/40 hover:bg-slate-800/60 disabled:cursor-not-allowed disabled:opacity-50"
                )}
              >
                {/* accent glow on hover */}
                <div
                  className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-0 blur-2xl transition-opacity group-hover:opacity-40"
                  style={{ background: ACCENT[tpl.id] }}
                />
                <div
                  className="relative flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg"
                  style={{ background: `${ACCENT[tpl.id]}1f`, color: ACCENT[tpl.id] }}
                >
                  {ICONS[tpl.id]}
                </div>
                <div className="relative min-w-0">
                  <div className="text-sm font-semibold text-white">{tpl.name}</div>
                  <div className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-slate-400">
                    {tpl.tagline}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <p className="mt-9 text-xs text-slate-500">
          Tip: enable hands-free mode after loading a plant, then just talk —
          say “take me to the reactor”, “hide valves”, or “quiz me”.
        </p>
      </div>
    </div>
  );
}
