"use client";

import { useState } from "react";
import { Loader2, Factory, FlaskConical, Wind, Wine, Mic, ArrowRight } from "lucide-react";
import { PLANT_TEMPLATES } from "@/lib/plant/templates";
import { useAppStore } from "@/lib/store/useAppStore";
import { cn } from "@/lib/utils";

interface WelcomeScreenProps {
  onBuild: (command: string) => void;
}

const ICONS: Record<string, React.ReactNode> = {
  ammonia: <Factory className="h-4 w-4" />,
  distillation: <FlaskConical className="h-4 w-4" />,
  "sulfuric-acid": <Wind className="h-4 w-4" />,
  ethanol: <Wine className="h-4 w-4" />,
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
    <div className="absolute inset-0 z-30 flex h-screen items-center justify-center overflow-hidden bg-[#3a4555] px-6">
      {/* restrained background — single subtle vignette, no busy gradients */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_40%,_rgba(20,24,32,0.4),_transparent_70%)]" />
      </div>

      <div className="relative z-10 w-full max-w-xl">
        {/* eyebrow */}
        <div className="mb-4 flex items-center justify-center gap-2 text-[10px] font-medium uppercase tracking-[0.25em] text-slate-500">
          <span className="h-1 w-1 rounded-full bg-sky-400" />
          Chemical Engineering · AI Learning Environment
        </div>

        {/* title — restrained, no gradient text */}
        <h1 className="text-center text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          AI Chemical Plant Explorer
        </h1>
        <p className="mx-auto mt-2 max-w-md text-center text-[13px] leading-relaxed text-slate-400">
          Speak or type a plant to build. An AI assembles an interactive 3D
          plant you can walk through and learn from — by conversation.
        </p>

        {/* command input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleCommand(command);
          }}
          className="mx-auto mt-6 flex max-w-md gap-2"
        >
          <div className="relative flex-1">
            <input
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder='Build an ammonia plant'
              disabled={isGenerating}
              className="w-full rounded-lg border border-slate-800 bg-slate-950/80 px-3.5 py-2.5 pl-9 text-[13px] text-white placeholder:text-slate-600 outline-none transition-colors focus:border-slate-600 disabled:opacity-50"
            />
            <Mic className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          </div>
          <button
            type="submit"
            disabled={isGenerating || !command.trim()}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-100 px-4 py-2.5 text-[13px] font-medium text-slate-900 transition-colors",
              "hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
            )}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Building
              </>
            ) : (
              <>
                Build <ArrowRight className="h-3 w-3" />
              </>
            )}
          </button>
        </form>

        {/* divider */}
        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-800/80" />
          <span className="text-[10px] uppercase tracking-[0.2em] text-slate-600">or pick</span>
          <div className="h-px flex-1 bg-slate-800/80" />
        </div>

        {/* template cards — compact 2x2 grid */}
        <div className="grid grid-cols-2 gap-2">
          {PLANT_TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => handleCommand(`Build a ${tpl.name.toLowerCase().split(" ")[0]} plant`)}
              disabled={isGenerating}
              className={cn(
                "group flex items-center gap-2.5 rounded-lg border border-slate-800/80 bg-slate-950/40 px-3 py-2.5 text-left transition-colors",
                "hover:border-slate-700 hover:bg-slate-900/60 disabled:opacity-40"
              )}
            >
              <div
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md ring-1"
                style={{
                  background: `${ACCENT[tpl.id]}12`,
                  color: ACCENT[tpl.id],
                  borderColor: `${ACCENT[tpl.id]}30`,
                }}
              >
                {ICONS[tpl.id]}
              </div>
              <div className="min-w-0">
                <div className="truncate text-[12px] font-medium text-slate-200">
                  {tpl.name.split(" (")[0]}
                </div>
                <div className="truncate text-[10px] text-slate-500">
                  {tpl.id === "ammonia" && "Haber–Bosch"}
                  {tpl.id === "distillation" && "Binary separation"}
                  {tpl.id === "sulfuric-acid" && "Contact process"}
                  {tpl.id === "ethanol" && "Fermentation"}
                </div>
              </div>
            </button>
          ))}
        </div>

        <p className="mt-5 text-center text-[10px] text-slate-600">
          After loading, enable hands-free mode and just talk.
        </p>
      </div>
    </div>
  );
}
