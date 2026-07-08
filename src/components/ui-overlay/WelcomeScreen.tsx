"use client";

import { useState, useEffect, useRef } from "react";
import { Mic, ArrowUp, Settings, Atom, Bot } from "lucide-react";
import { PLANT_TEMPLATES } from "@/lib/plant/templates";
import { useAppStore } from "@/lib/store/useAppStore";
import { cn } from "@/lib/utils";
import { SettingsDrawer } from "./SettingsDrawer";

interface WelcomeScreenProps {
  onBuild: (command: string) => void;
}

const SUGGESTIONS = [
  { label: "Ammonia", command: "Build an ammonia plant" },
  { label: "Distillation", command: "Build a distillation plant" },
  { label: "Sulfuric Acid", command: "Build a sulfuric acid plant" },
  { label: "Ethanol", command: "Build an ethanol plant" },
];

export function WelcomeScreen({ onBuild }: WelcomeScreenProps) {
  const isGenerating = useAppStore((s) => s.isGenerating);
  const [command, setCommand] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus the input on mount
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

      {/* Center area — AI greeting + input */}
      <div className="flex flex-1 flex-col items-center justify-center px-6">
        <div className="w-full max-w-lg">
          {/* AI greeting bubble */}
          <div className="mb-8 flex justify-start gap-2.5">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-sky-500/15 ring-1 ring-sky-500/30">
              <Bot className="h-3.5 w-3.5 text-sky-300" />
            </div>
            <div>
              <div className="rounded-2xl rounded-tl-sm border border-slate-800 bg-[#0d0f14] px-4 py-3">
                <p className="text-[14px] leading-relaxed text-slate-200">
                  Hey! I'm your process engineer. I can build you an interactive 3D
                  chemical plant and walk you through it. What do you want to explore —
                  ammonia, distillation, sulfuric acid, or ethanol?
                </p>
              </div>
              <div className="mt-1.5 flex items-center gap-1.5 pl-1">
                <span className="h-1 w-1 rounded-full bg-emerald-400" />
                <span className="text-[10px] text-slate-500">AI Process Engineer · online</span>
              </div>
            </div>
          </div>

          {/* Chat input — ChatGPT style */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleCommand(command);
            }}
            className="relative"
          >
            <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-[#0d0f14] px-3 py-2.5 transition-colors focus-within:border-slate-600">
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
                className="flex-1 bg-transparent text-[13px] text-white placeholder:text-slate-600 outline-none disabled:opacity-50"
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
                <ArrowUp className="h-4 w-4" />
              </button>
            </div>
          </form>

          {/* Suggestion chips */}
          <div className="mt-3 flex flex-wrap justify-center gap-1.5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s.label}
                onClick={() => handleCommand(s.command)}
                disabled={isGenerating}
                className="rounded-full border border-slate-800 bg-[#0d0f14] px-3 py-1 text-[11px] text-slate-400 transition-colors hover:border-slate-700 hover:bg-slate-900 hover:text-slate-200 disabled:opacity-40"
              >
                {s.label}
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
