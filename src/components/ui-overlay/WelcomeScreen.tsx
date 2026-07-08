"use client";

import { useState, useEffect, useRef } from "react";
import { Mic, ArrowRight, Settings, Atom, Factory, FlaskConical, Wind, Wine, Clock, Zap } from "lucide-react";
import { PLANT_TEMPLATES } from "@/lib/plant/templates";
import { useAppStore } from "@/lib/store/useAppStore";
import { cn } from "@/lib/utils";
import { SettingsDrawer } from "./SettingsDrawer";

interface WelcomeScreenProps {
  onBuild: (command: string) => void;
}

const ICONS: Record<string, React.ReactNode> = {
  ammonia: <Factory className="h-5 w-5" />,
  distillation: <FlaskConical className="h-5 w-5" />,
  "sulfuric-acid": <Wind className="h-5 w-5" />,
  ethanol: <Wine className="h-5 w-5" />,
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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleCommand = (text: string) => {
    if (isGenerating) return;
    onBuild(text.trim());
  };

  return (
    <div className="absolute inset-0 z-30 flex h-screen flex-col bg-[#08090c]">
      {/* Minimal header */}
      <header className="flex items-center justify-between px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100">
            <Atom className="h-3.5 w-3.5 text-slate-900" />
          </div>
          <span className="text-[12px] font-medium text-slate-300">AI Chemical Plant Explorer</span>
        </div>
        <button
          onClick={() => setSettingsOpen(true)}
          aria-label="Settings"
          className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-900 hover:text-slate-200"
        >
          <Settings className="h-4 w-4" />
        </button>
      </header>

      {/* Main content — game launcher style */}
      <div className="flex flex-1 flex-col px-6 pb-6">
        <div className="mx-auto w-full max-w-4xl">
          {/* Hero — left aligned, bold, minimal */}
          <div className="mb-8">
            <div className="mb-3 flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500">
              <span className="h-1 w-1 rounded-full bg-sky-400" />
              Immersive 3D · Voice-Guided · Learn by Exploring
            </div>
            <h1 className="text-[32px] font-bold leading-tight tracking-tight text-white sm:text-[40px]">
              Step inside the world's most
              <br />
              important chemical plants.
            </h1>
            <p className="mt-3 text-[14px] text-slate-400">
              Your AI process engineer is standing by. Pick a plant to enter.
            </p>
          </div>

          {/* Plant cards — game launcher grid */}
          <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {PLANT_TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => handleCommand(`Build a ${tpl.name.toLowerCase().split(" ")[0]} plant`)}
                disabled={isGenerating}
                className={cn(
                  "group relative flex flex-col overflow-hidden rounded-xl border border-slate-800/80 bg-slate-950/50 p-3 text-left transition-all",
                  "hover:border-slate-700 hover:bg-slate-900/60 disabled:cursor-not-allowed disabled:opacity-40"
                )}
              >
                {/* Accent glow on hover */}
                <div
                  className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-30"
                  style={{ background: ACCENT[tpl.id] }}
                />

                {/* Icon */}
                <div
                  className="relative mb-2.5 flex h-9 w-9 items-center justify-center rounded-lg ring-1 transition-transform group-hover:scale-110"
                  style={{
                    background: `${ACCENT[tpl.id]}15`,
                    color: ACCENT[tpl.id],
                    borderColor: `${ACCENT[tpl.id]}30`,
                  }}
                >
                  {ICONS[tpl.id]}
                </div>

                {/* Name */}
                <div className="relative text-[13px] font-semibold text-white">
                  {tpl.name.split(" (")[0]}
                </div>

                {/* Tagline */}
                <div className="relative mt-0.5 line-clamp-2 text-[10px] leading-relaxed text-slate-500">
                  {tpl.tagline}
                </div>

                {/* Stats */}
                <div className="relative mt-2.5 flex items-center gap-2.5 text-[9px] text-slate-600">
                  <span className="flex items-center gap-0.5">
                    <Factory className="h-2.5 w-2.5" />
                    {tpl.equipment.length} units
                  </span>
                  <span className="flex items-center gap-0.5">
                    <Clock className="h-2.5 w-2.5" />
                    ~{tpl.estimatedTime}m
                  </span>
                </div>

                {/* Difficulty badge */}
                <div className="relative mt-1.5">
                  <span
                    className={cn(
                      "inline-block rounded px-1.5 py-0.5 text-[8px] font-medium uppercase tracking-wider",
                      tpl.difficulty === "Beginner" && "bg-emerald-500/10 text-emerald-400",
                      tpl.difficulty === "Intermediate" && "bg-amber-500/10 text-amber-400",
                      tpl.difficulty === "Advanced" && "bg-rose-500/10 text-rose-400"
                    )}
                  >
                    {tpl.difficulty}
                  </span>
                </div>

                {/* Hover arrow */}
                <div className="relative mt-2 flex items-center gap-1 text-[10px] font-medium text-slate-500 opacity-0 transition-opacity group-hover:text-slate-300 group-hover:opacity-100">
                  Enter <ArrowRight className="h-2.5 w-2.5" />
                </div>
              </button>
            ))}
          </div>

          {/* Secondary input — voice/text */}
          <div className="mx-auto max-w-lg">
            <div className="mb-2 flex items-center gap-2 text-[10px] text-slate-600">
              <div className="h-px flex-1 bg-slate-800/60" />
              <span>or describe what you want to explore</span>
              <div className="h-px flex-1 bg-slate-800/60" />
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCommand(command);
              }}
              className="relative"
            >
              <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 transition-colors focus-within:border-slate-600">
                <button
                  type="button"
                  aria-label="Voice input"
                  className="flex h-6 w-6 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-800 hover:text-sky-300"
                >
                  <Mic className="h-3.5 w-3.5" />
                </button>
                <input
                  ref={inputRef}
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  placeholder="Build an ammonia plant…"
                  disabled={isGenerating}
                  className="flex-1 bg-transparent text-[12px] text-white placeholder:text-slate-600 outline-none disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={isGenerating || !command.trim()}
                  aria-label="Send"
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-md transition-colors",
                    command.trim() && !isGenerating
                      ? "bg-sky-500 text-white hover:bg-sky-400"
                      : "bg-slate-800 text-slate-600"
                  )}
                >
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </form>
          </div>

          {/* Stats bar */}
          <div className="mt-6 flex items-center justify-center gap-4 text-[9px] font-mono uppercase tracking-wider text-slate-700">
            <span>4 plants</span>
            <span>·</span>
            <span>31 equipment types</span>
            <span>·</span>
            <span>6+ hours content</span>
          </div>
        </div>
      </div>

      {/* Settings drawer */}
      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
