"use client";

import { useAppStore } from "@/lib/store/useAppStore";
import { Atom, RotateCcw } from "lucide-react";

export function Header() {
  const currentPlant = useAppStore((s) => s.currentPlant);
  const resetPlant = useAppStore((s) => s.resetPlant);

  return (
    <header className="pointer-events-auto flex items-center justify-between gap-4 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 via-cyan-500 to-violet-500 shadow-lg shadow-sky-500/25">
          <Atom className="h-5 w-5 text-white" />
          <div className="absolute inset-0 rounded-xl ring-1 ring-white/20" />
        </div>
        <div>
          <h1 className="text-sm font-semibold leading-tight text-white">
            AI Chemical Plant Explorer
          </h1>
          {currentPlant ? (
            <div className="flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-emerald-400" />
              <p className="text-[11px] text-slate-400">{currentPlant.name}</p>
            </div>
          ) : (
            <p className="text-[11px] text-slate-500">Voice-first learning environment</p>
          )}
        </div>
      </div>

      {currentPlant && (
        <button
          onClick={() => resetPlant()}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700/60 bg-slate-900/70 px-3 py-1.5 text-xs font-medium text-slate-200 backdrop-blur transition-colors hover:bg-slate-800 hover:text-white"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          New plant
        </button>
      )}
    </header>
  );
}
