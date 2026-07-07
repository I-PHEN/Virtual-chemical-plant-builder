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
    <div className="pointer-events-auto w-[320px] rounded-2xl border border-sky-500/40 bg-slate-900/90 p-4 backdrop-blur-md shadow-2xl">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-300">
          <MapPin className="h-3.5 w-3.5" />
          Guided Tour · Step {step.order} / {total}
        </div>
        <button
          onClick={() => {
            setTourStep(null);
            selectEquipment(null);
          }}
          aria-label="End tour"
          className="rounded p-0.5 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <h3 className="text-sm font-semibold text-white">{step.title}</h3>
      <p className="mt-1 text-xs leading-relaxed text-slate-300">{step.description}</p>

      {/* progress bar */}
      <div className="mt-3 flex gap-1">
        {currentPlant.processSteps.map((s, i) => (
          <div
            key={s.order}
            className={`h-1 flex-1 rounded-full ${
              i <= tourStep ? "bg-sky-500" : "bg-slate-700"
            }`}
          />
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <button
          onClick={() => setTourStep(Math.max(0, tourStep - 1))}
          disabled={tourStep === 0}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-slate-300 hover:bg-slate-800 disabled:opacity-40"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Prev
        </button>
        <button
          onClick={() => {
            const next = Math.min(total - 1, tourStep + 1);
            setTourStep(next);
            const nextStep = currentPlant.processSteps[next];
            if (nextStep) selectEquipment(nextStep.equipmentId);
          }}
          disabled={tourStep === total - 1}
          className="flex items-center gap-1 rounded-lg bg-sky-500 px-2 py-1 text-xs font-medium text-white hover:bg-sky-400 disabled:opacity-40"
        >
          Next <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
