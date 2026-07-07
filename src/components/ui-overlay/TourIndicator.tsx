"use client";

import { ChevronLeft, ChevronRight, X, MapPin } from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";

export function TourIndicator() {
  const tourStep = useAppStore((s) => s.tourStep);
  const currentPlant = useAppStore((s) => s.currentPlant);
  const setTourStep = useAppStore((s) => s.setTourStep);
  const selectEquipment = useAppStore((s) => s.selectEquipment);

  if (tourStep === null || !currentPlant) return null;
  const step = currentPlant.processSteps[tourStep];
  if (!step) return null;

  const total = currentPlant.processSteps.length;

  return (
    <div className="pointer-events-auto w-[280px] rounded-lg border border-slate-800/80 bg-slate-950/90 p-2.5 shadow-2xl backdrop-blur">
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

      <div className="mt-2 flex gap-0.5">
        {currentPlant.processSteps.map((s, i) => (
          <div
            key={s.order}
            className={`h-0.5 flex-1 rounded-full ${i <= tourStep ? "bg-sky-400" : "bg-slate-800"}`}
          />
        ))}
      </div>

      <div className="mt-2 flex items-center justify-between">
        <button
          onClick={() => setTourStep(Math.max(0, tourStep - 1))}
          disabled={tourStep === 0}
          className="flex items-center gap-0.5 rounded px-1.5 py-1 text-[10px] text-slate-400 hover:bg-slate-800 disabled:opacity-30"
        >
          <ChevronLeft className="h-3 w-3" /> Prev
        </button>
        <button
          onClick={() => {
            const next = Math.min(total - 1, tourStep + 1);
            setTourStep(next);
            const nextStep = currentPlant.processSteps[next];
            if (nextStep) selectEquipment(nextStep.equipmentId);
          }}
          disabled={tourStep === total - 1}
          className="flex items-center gap-0.5 rounded bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-900 hover:bg-white disabled:opacity-30"
        >
          Next <ChevronRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
