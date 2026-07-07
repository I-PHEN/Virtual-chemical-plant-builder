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
    <div className="absolute inset-0 z-30 flex items-center justify-center overflow-y-auto bg-[#05070d] px-4 py-8">
      {/* layered cinematic dark background */}
      <div className="pointer-events-none absolute inset-0">
        {/* deep base gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,_rgba(15,23,42,0.9),_#05070d_70%)]" />
        {/* sky glow top-left */}
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-sky-500/10 blur-[120px]" />
        {/* violet glow bottom-right */}
        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-violet-600/10 blur-[120px]" />
        {/* cyan accent center */}
        <div className="absolute left-1/2 top-1/2 h-[300px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/5 blur-[100px]" />
        {/* fine grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(56,189,248,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.04)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_80%)]" />
        {/* vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_40%,_#05070d_100%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl text-center">
        {/* badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/[0.07] px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.15em] text-sky-300/90 backdrop-blur">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-sky-400" />
          </span>
          AI-Native Chemical Engineering Platform
        </div>

        {/* title */}
        <h1 className="text-5xl font-bold tracking-tight text-white sm:text-7xl">
          AI Chemical Plant{" "}
          <span className="block bg-gradient-to-r from-sky-400 via-cyan-300 to-violet-400 bg-clip-text text-transparent sm:inline">
            Explorer
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg">
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
          className="mx-auto mt-9 flex max-w-xl gap-2"
        >
          <div className="relative flex-1">
            <input
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder='Try: "Build an ammonia plant"'
              disabled={isGenerating}
              className="w-full rounded-xl border border-slate-800/80 bg-slate-950/80 px-4 py-4 pl-12 text-white placeholder:text-slate-600 shadow-2xl outline-none backdrop-blur transition-all focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20 disabled:opacity-50"
            />
            <Mic className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-sky-400" />
          </div>
          <button
            type="submit"
            disabled={isGenerating || !command.trim()}
            className={cn(
              "flex items-center gap-2 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500 px-6 py-4 font-semibold text-white shadow-2xl shadow-sky-500/20 transition-all",
              "hover:from-sky-400 hover:to-cyan-400 hover:shadow-sky-500/40 disabled:cursor-not-allowed disabled:opacity-40"
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
        <div className="mt-10 text-left">
          <div className="mb-3 flex items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-slate-700/50" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              or pick a plant
            </span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-slate-700/50" />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {PLANT_TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => handleCommand(`Build a ${tpl.name.toLowerCase().split(" ")[0]} plant`)}
                disabled={isGenerating}
                className={cn(
                  "group relative flex items-start gap-3 overflow-hidden rounded-xl border border-slate-800/80 bg-slate-950/60 p-4 text-left backdrop-blur transition-all",
                  "hover:border-sky-500/30 hover:bg-slate-900/60 disabled:cursor-not-allowed disabled:opacity-50"
                )}
              >
                {/* accent glow on hover */}
                <div
                  className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-30"
                  style={{ background: ACCENT[tpl.id] }}
                />
                <div
                  className="relative flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg ring-1 transition-transform group-hover:scale-110"
                  style={{
                    background: `${ACCENT[tpl.id]}15`,
                    color: ACCENT[tpl.id],
                    boxShadow: `0 0 20px ${ACCENT[tpl.id]}20`,
                  }}
                >
                  {ICONS[tpl.id]}
                </div>
                <div className="relative min-w-0">
                  <div className="text-sm font-semibold text-white">{tpl.name}</div>
                  <div className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-slate-500">
                    {tpl.tagline}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <p className="mt-10 text-xs text-slate-600">
          Tip: after loading a plant, enable hands-free mode and just talk —
          say “take me to the reactor”, “hide valves”, or “quiz me”.
        </p>
      </div>
    </div>
  );
}
