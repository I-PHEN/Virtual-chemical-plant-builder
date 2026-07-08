"use client";

import { useAppStore } from "@/lib/store/useAppStore";
import { Atom, RotateCcw } from "lucide-react";

export function Header() {
  const currentPlant = useAppStore((s) => s.currentPlant);
  const resetPlant = useAppStore((s) => s.resetPlant);

  return (
    <header className="pointer-events-auto flex items-center justify-between gap-4 px-4 py-2.5">
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 ring-1 ring-white/10">
          <Atom className="h-3.5 w-3.5 text-slate-900" />
        </div>
        <div className="leading-tight">
          <h1 className="text-[12px] font-medium text-slate-200">
            AI Chemical Plant Explorer
          </h1>
          {currentPlant ? (
            <div className="flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-emerald-400" />
              <p className="text-[10px] text-slate-500">{currentPlant.name.split(" (")[0]}</p>
            </div>
          ) : (
            <p className="text-[10px] text-slate-600">Voice-first learning</p>
          )}
        </div>
      </div>

      {currentPlant && (
        <button
          onClick={() => resetPlant()}
          className="flex items-center gap-1.5 rounded-md border border-slate-800 bg-slate-950/60 px-2.5 py-1.5 text-[11px] font-medium text-slate-300 transition-colors hover:bg-slate-900 hover:text-white"
        >
          <RotateCcw className="h-3 w-3" />
          New
        </button>
      )}
    </header>
  );
}
