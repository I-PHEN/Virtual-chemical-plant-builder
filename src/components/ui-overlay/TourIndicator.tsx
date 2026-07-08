"use client";

import { X, MapPin } from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";

export function TourIndicator() {
  const tourStep = useAppStore((s) => s.tourStep);
  const tourAutoAdvance = useAppStore((s) => s.tourAutoAdvance);
  const setTourAutoAdvance = useAppStore((s) => s.setTourAutoAdvance);
  const currentPlant = useAppStore((s) => s.currentPlant);
  const setTourStep = useAppStore((s) => s.setTourStep);
  const selectEquipment = useAppStore((s) => s.selectEquipment);

  if (tourStep === null || !currentPlant) return null;
  const step = currentPlant.processSteps[tourStep];
  if (!step) return null;

  const total = currentPlant.processSteps.length;

  return (
    <div className="pointer-events-auto w-[260px] rounded-lg border border-slate-800/80 bg-slate-950/90 p-2.5 shadow-2xl backdrop-blur">
      <div className="mb-1.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[9px] font-medium uppercase tracking-wider text-sky-400">
          <MapPin className="h-2.5 w-2.5" />
          Tour · {step.order}/{total}
        </div>
        <button
          onClick={() => {
            setTourStep(null);
            selectEquipment(null);
          }}
          aria-label="End tour"
          className="rounded p-0.5 text-slate-500 hover:bg-slate-800 hover:text-white"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
      <h3 className="text-[12px] font-semibold text-white">{step.title}</h3>
      <p className="mt-0.5 text-[11px] leading-relaxed text-slate-400">{step.description}</p>

      {/* progress */}
      <div className="mt-2 flex gap-0.5">
        {currentPlant.processSteps.map((s, i) => (
          <div
            key={s.order}
            className={`h-0.5 flex-1 rounded-full ${i <= tourStep ? "bg-sky-400" : "bg-slate-800"}`}
          />
        ))}
      </div>

      {/* auto-advance indicator */}
      <div className="mt-2 flex items-center justify-between">
        <button
          onClick={() => setTourAutoAdvance(!tourAutoAdvance)}
          className="flex items-center gap-1 text-[9px] text-slate-500 hover:text-slate-300"
        >
          <span className={`h-1.5 w-1.5 rounded-full ${tourAutoAdvance ? "bg-emerald-400 animate-pulse" : "bg-slate-600"}`} />
          {tourAutoAdvance ? "auto" : "manual"}
        </button>
        <span className="text-[9px] text-slate-600">say "next" or "back"</span>
      </div>
    </div>
  );
}
