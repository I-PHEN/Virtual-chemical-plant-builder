"use client";

import { useState, useEffect, useRef } from "react";
import { Mic, ArrowRight, Settings, Atom, Factory, FlaskConical, Wind, Wine, Clock } from "lucide-react";
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
      {/* Minimal header — top */}
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

      {/* Large empty space at top — splash screen feel */}
      <div className="flex-1" />

      {/* Bottom-aligned content — input + cards pushed to lower third */}
      <div className="px-6 pb-8">
        <div className="mx-auto w-full max-w-2xl">
          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleCommand(command);
            }}
            className="relative mb-5"
          >
            <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-3 transition-colors focus-within:border-slate-600">
              <button
                type="button"
                aria-label="Voice input"
                className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-800 hover:text-sky-300"
              >
                <Mic className="h-4 w-4" />
              </button>
              <input
                ref={inputRef}
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="Build an ammonia plant…"
                disabled={isGenerating}
                className="flex-1 bg-transparent text-[14px] text-white placeholder:text-slate-600 outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isGenerating || !command.trim()}
                aria-label="Send"
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
                  command.trim() && !isGenerating
                    ? "bg-sky-500 text-white hover:bg-sky-400"
                    : "bg-slate-800 text-slate-600"
                )}
              >
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </form>

          {/* Plant cards — directly below input */}
          <div className="mb-2 flex items-center gap-2 text-[9px] uppercase tracking-[0.2em] text-slate-600">
            <div className="h-px flex-1 bg-slate-800/60" />
            <span>or pick a plant</span>
            <div className="h-px flex-1 bg-slate-800/60" />
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {PLANT_TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => handleCommand(`Build a ${tpl.name.toLowerCase().split(" ")[0]} plant`)}
                disabled={isGenerating}
                className={cn(
                  "group relative flex flex-col overflow-hidden rounded-lg border border-slate-800/80 bg-slate-950/50 p-3 text-left transition-all",
                  "hover:border-slate-700 hover:bg-slate-900/60 disabled:cursor-not-allowed disabled:opacity-40"
                )}
              >
                <div
                  className="pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-25"
                  style={{ background: ACCENT[tpl.id] }}
                />
                <div
                  className="relative mb-2 flex h-8 w-8 items-center justify-center rounded-lg ring-1 transition-transform group-hover:scale-110"
                  style={{
                    background: `${ACCENT[tpl.id]}15`,
                    color: ACCENT[tpl.id],
                    borderColor: `${ACCENT[tpl.id]}30`,
                  }}
                >
                  {ICONS[tpl.id]}
                </div>
                <div className="relative text-[12px] font-semibold text-white">
                  {tpl.name.split(" (")[0]}
                </div>
                <div className="relative mt-0.5 line-clamp-2 text-[9px] leading-relaxed text-slate-500">
                  {tpl.tagline}
                </div>
                <div className="relative mt-2 flex items-center gap-2 text-[8px] text-slate-600">
                  <span className="flex items-center gap-0.5">
                    <Factory className="h-2.5 w-2.5" />
                    {tpl.equipment.length}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <Clock className="h-2.5 w-2.5" />
                    {tpl.estimatedTime}m
                  </span>
                  <span
                    className={cn(
                      "ml-auto rounded px-1 py-0.5 text-[7px] font-medium uppercase",
                      tpl.difficulty === "Beginner" && "bg-emerald-500/10 text-emerald-400",
                      tpl.difficulty === "Intermediate" && "bg-amber-500/10 text-amber-400"
                    )}
                  >
                    {tpl.difficulty}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Settings drawer */}
      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
