"use client";

import { useAppStore } from "@/lib/store/useAppStore";
import {
  Eye,
  EyeOff,
  Route,
  Map,
  HelpCircle,
  RotateCcw,
  Plus,
} from "lucide-react";
import { useState } from "react";
import type { EquipmentType } from "@/lib/plant/types";
import { EQUIPMENT_LIBRARY } from "@/lib/plant/equipmentLibrary";

interface CommandBarProps {
  onCommand: (text: string) => void;
}

export function CommandBar({ onCommand }: CommandBarProps) {
  const currentPlant = useAppStore((s) => s.currentPlant);
  const showAll = useAppStore((s) => s.showAll);
  const setTourStep = useAppStore((s) => s.setTourStep);
  const resetPlant = useAppStore((s) => s.resetPlant);
  const highlightType = useAppStore((s) => s.highlightType);
  const setHighlight = useAppStore((s) => s.setHighlight);

  const [showTemplates, setShowTemplates] = useState(false);

  if (!currentPlant) return null;

  const presentTypes = Array.from(new Set(currentPlant.equipment.map((e) => e.type))) as EquipmentType[];

  return (
    <div className="pointer-events-auto flex flex-wrap items-center gap-1 rounded-2xl border border-slate-700/50 bg-slate-900/80 p-1.5 shadow-2xl ring-1 ring-white/5 backdrop-blur-xl">
      <QuickBtn
        icon={<Route className="h-3.5 w-3.5" />}
        label="Tour"
        onClick={() => {
          setTourStep(0);
          onCommand("Take me through the whole plant.");
        }}
      />
      <QuickBtn
        icon={<Map className="h-3.5 w-3.5" />}
        label="Overview"
        onClick={() => onCommand("Give me an overview of this plant.")}
      />
      <QuickBtn
        icon={<HelpCircle className="h-3.5 w-3.5" />}
        label="Quiz"
        onClick={() => onCommand("Quiz me on this plant.")}
      />
      <div className="mx-0.5 h-5 w-px bg-slate-700/60" />

      {/* highlight dropdown */}
      <div className="relative">
        <QuickBtn
          icon={<Eye className="h-3.5 w-3.5" />}
          label={highlightType ? `Only ${highlightType}` : "Show only…"}
          onClick={() => setShowTemplates((s) => !s)}
        />
        {showTemplates && (
          <div className="absolute bottom-full left-0 mb-2 w-48 overflow-hidden rounded-xl border border-slate-700/60 bg-slate-900/95 shadow-2xl backdrop-blur-xl">
            <div className="border-b border-slate-700/40 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Show only
            </div>
            <button
              onClick={() => {
                setHighlight(null);
                setShowTemplates(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-300 transition-colors hover:bg-slate-800"
            >
              <EyeOff className="h-3 w-3" />
              Show all
            </button>
            {presentTypes.map((t) => (
              <button
                key={t}
                onClick={() => {
                  setHighlight(t);
                  setShowTemplates(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-300 transition-colors hover:bg-slate-800"
              >
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: EQUIPMENT_LIBRARY[t].color }}
                />
                {EQUIPMENT_LIBRARY[t].singularName}s
              </button>
            ))}
          </div>
        )}
      </div>

      <QuickBtn
        icon={<EyeOff className="h-3.5 w-3.5" />}
        label="Show all"
        onClick={() => {
          showAll();
          onCommand("Show me everything again.");
        }}
      />
      <div className="mx-0.5 h-5 w-px bg-slate-700/60" />
      <QuickBtn
        icon={<Plus className="h-3.5 w-3.5" />}
        label="New plant"
        onClick={() => resetPlant()}
      />
      <QuickBtn
        icon={<RotateCcw className="h-3.5 w-3.5" />}
        label="Reset view"
        onClick={() => {
          showAll();
          setTourStep(null);
          onCommand("Where are we?");
        }}
      />
    </div>
  );
}

function QuickBtn({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-200 transition-all hover:bg-slate-800 hover:text-white"
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
