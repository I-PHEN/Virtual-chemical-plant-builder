"use client";

import { useState } from "react";
import { X, ChevronDown, ChevronRight, AlertTriangle, Wrench, FunctionSquare, HelpCircle, Gauge } from "lucide-react";
import { useAppStore, useSelectedEquipment } from "@/lib/store/useAppStore";
import { getEquipmentMeta } from "@/lib/plant/equipmentLibrary";
import { cn } from "@/lib/utils";

export function EquipmentPanel() {
  const selected = useSelectedEquipment();
  const selectEquipment = useAppStore((s) => s.selectEquipment);

  if (!selected) return null;
  const meta = getEquipmentMeta(selected.type);

  return (
    <div className="pointer-events-auto flex max-h-[calc(100vh-7rem)] w-[340px] flex-col overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/90 backdrop-blur-md shadow-2xl">
      {/* header */}
      <div
        className="flex items-start justify-between gap-2 px-4 py-3"
        style={{ background: `linear-gradient(135deg, ${meta.color}33, transparent)` }}
      >
        <div>
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ background: meta.color }}
            />
            <span className="text-[10px] uppercase tracking-wider text-slate-400">
              {meta.category}
            </span>
          </div>
          <h2 className="mt-1 text-base font-semibold text-white">{selected.name}</h2>
          <p className="text-xs text-slate-400">{meta.singularName} · {meta.tagline}</p>
        </div>
        <button
          onClick={() => selectEquipment(null)}
          aria-label="Close panel"
          className="rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* scrollable body */}
      <div className="flex-1 overflow-y-auto px-4 py-3 text-sm text-slate-200">
        {selected.context && (
          <Section title="In this plant">
            <p className="text-xs leading-relaxed text-slate-300">{selected.context}</p>
          </Section>
        )}

        <Section title="Purpose">
          <p className="text-xs leading-relaxed text-slate-300">{meta.purpose}</p>
        </Section>

        <Collapsible title="Working principle" icon={<Wrench className="h-3.5 w-3.5" />} defaultOpen>
          <p className="text-xs leading-relaxed text-slate-300">{meta.workingPrinciple}</p>
        </Collapsible>

        <Collapsible title="Operating conditions" icon={<Gauge className="h-3.5 w-3.5" />}>
          <p className="text-xs leading-relaxed text-slate-300">{meta.operatingConditions}</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <div>
              <div className="mb-1 text-[10px] uppercase text-slate-500">Inputs</div>
              <ul className="space-y-0.5 text-xs text-slate-300">
                {meta.inputs.map((i, idx) => (
                  <li key={idx}>• {i}</li>
                ))}
              </ul>
            </div>
            <div>
              <div className="mb-1 text-[10px] uppercase text-slate-500">Outputs</div>
              <ul className="space-y-0.5 text-xs text-slate-300">
                {meta.outputs.map((o, idx) => (
                  <li key={idx}>• {o}</li>
                ))}
              </ul>
            </div>
          </div>
        </Collapsible>

        <Collapsible title="Safety concerns" icon={<AlertTriangle className="h-3.5 w-3.5" />}>
          <ul className="space-y-1 text-xs text-slate-300">
            {meta.safetyConcerns.map((s, idx) => (
              <li key={idx} className="flex gap-1.5">
                <AlertTriangle className="mt-0.5 h-3 w-3 flex-shrink-0 text-amber-400" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </Collapsible>

        <Collapsible title="Failure modes" icon={<Wrench className="h-3.5 w-3.5" />}>
          <ul className="space-y-1 text-xs text-slate-300">
            {meta.failureModes.map((f, idx) => (
              <li key={idx}>• {f}</li>
            ))}
          </ul>
        </Collapsible>

        <Collapsible title="Key equations" icon={<FunctionSquare className="h-3.5 w-3.5" />}>
          <div className="space-y-2">
            {meta.equations.map((e, idx) => (
              <div key={idx} className="rounded-lg bg-slate-800/60 p-2">
                <div className="text-[11px] font-semibold text-sky-300">{e.name}</div>
                <div className="my-1 font-mono text-xs text-amber-300">{e.formula}</div>
                <div className="text-[11px] leading-relaxed text-slate-400">{e.description}</div>
              </div>
            ))}
          </div>
        </Collapsible>

        <Collapsible title="Interview questions" icon={<HelpCircle className="h-3.5 w-3.5" />}>
          <ol className="list-decimal space-y-1 pl-4 text-xs text-slate-300">
            {meta.interviewQuestions.map((q, idx) => (
              <li key={idx}>{q}</li>
            ))}
          </ol>
        </Collapsible>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <h3 className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">{title}</h3>
      {children}
    </div>
  );
}

function Collapsible({
  title,
  icon,
  children,
  defaultOpen,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className="mb-2 border-t border-slate-800 pt-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between py-1 text-left"
      >
        <span className="flex items-center gap-2 text-xs font-semibold text-slate-200">
          {icon}
          {title}
        </span>
        {open ? <ChevronDown className="h-3.5 w-3.5 text-slate-500" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-500" />}
      </button>
      {open && <div className="mt-1 pb-1">{children}</div>}
    </div>
  );
}
