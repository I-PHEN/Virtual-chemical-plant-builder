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
    <div className="pointer-events-auto flex flex-wrap items-center gap-0.5 rounded-lg border border-slate-800/80 bg-slate-950/80 p-1 shadow-xl backdrop-blur">
      <QuickBtn
        icon={<Route className="h-3 w-3" />}
        label="Tour"
        onClick={() => {
          setTourStep(0);
          onCommand("Take me through the whole plant.");
        }}
      />
      <QuickBtn
        icon={<Map className="h-3 w-3" />}
        label="Overview"
        onClick={() => onCommand("Give me an overview of this plant.")}
      />
      <QuickBtn
        icon={<HelpCircle className="h-3 w-3" />}
        label="Quiz"
        onClick={() => onCommand("Quiz me on this plant.")}
      />
      <div className="mx-0.5 h-4 w-px bg-slate-800" />

      <div className="relative">
        <QuickBtn
          icon={<Eye className="h-3 w-3" />}
          label={highlightType ? "Only" : "Filter"}
          onClick={() => setShowTemplates((s) => !s)}
        />
        {showTemplates && (
          <div className="absolute bottom-full left-0 mb-1.5 w-40 overflow-hidden rounded-lg border border-slate-800 bg-slate-950/95 shadow-2xl backdrop-blur">
            <button
              onClick={() => {
                setHighlight(null);
                setShowTemplates(false);
              }}
              className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-[11px] text-slate-300 hover:bg-slate-900"
            >
              <EyeOff className="h-3 w-3" /> Show all
            </button>
            {presentTypes.map((t) => (
              <button
                key={t}
                onClick={() => {
                  setHighlight(t);
                  setShowTemplates(false);
                }}
                className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-[11px] text-slate-300 hover:bg-slate-900"
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: EQUIPMENT_LIBRARY[t].color }}
                />
                {EQUIPMENT_LIBRARY[t].singularName}s
              </button>
            ))}
          </div>
        )}
      </div>

      <QuickBtn
        icon={<EyeOff className="h-3 w-3" />}
        label="All"
        onClick={() => {
          showAll();
        }}
      />
      <div className="mx-0.5 h-4 w-px bg-slate-800" />
      <QuickBtn
        icon={<Plus className="h-3 w-3" />}
        label="New"
        onClick={() => resetPlant()}
      />
      <QuickBtn
        icon={<RotateCcw className="h-3 w-3" />}
        label="Reset"
        onClick={() => {
          showAll();
          setTourStep(null);
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
      className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
