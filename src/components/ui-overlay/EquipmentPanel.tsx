"use client";

import { useState } from "react";
import { X, ChevronDown, ChevronRight, AlertTriangle, Wrench, FunctionSquare, HelpCircle, Gauge, Crosshair } from "lucide-react";
import { useAppStore, useSelectedEquipment } from "@/lib/store/useAppStore";
import { getEquipmentMeta } from "@/lib/plant/equipmentLibrary";
import { useAIConversation } from "@/hooks/useAI";

export function EquipmentPanel() {
  const selected = useSelectedEquipment();
  const selectEquipment = useAppStore((s) => s.selectEquipment);
  const focusEquipment = useAppStore((s) => s.focusEquipment);
  const { send } = useAIConversation();

  if (!selected) return null;
  const meta = getEquipmentMeta(selected.type);

  const askAbout = (q: string) => {
    send(q);
  };

  return (
    <div className="pointer-events-auto flex max-h-[calc(100vh-9rem)] w-[280px] flex-col overflow-hidden rounded-lg border border-slate-800/80 bg-slate-950/85 shadow-2xl backdrop-blur">
      {/* header */}
      <div className="flex items-start justify-between gap-2 border-b border-slate-800/80 px-3 py-2.5">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: meta.color }}
            />
            <span className="text-[9px] font-medium uppercase tracking-wider text-slate-500">
              {meta.category}
            </span>
          </div>
          <h2 className="mt-0.5 truncate text-[13px] font-semibold text-white">{selected.name}</h2>
          <p className="truncate text-[10px] text-slate-500">{meta.singularName}</p>
        </div>
        <button
          onClick={() => selectEquipment(null)}
          aria-label="Close"
          className="rounded p-0.5 text-slate-500 hover:bg-slate-800 hover:text-white"
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      {/* quick actions */}
      <div className="flex gap-1 border-b border-slate-800/80 bg-slate-900/30 px-2 py-1.5">
        <QuickAction icon={<Crosshair className="h-2.5 w-2.5" />} label="Focus" onClick={() => focusEquipment(selected.id)} />
        <QuickAction icon={<HelpCircle className="h-2.5 w-2.5" />} label="Explain" onClick={() => askAbout(`Explain ${selected.name}.`)} />
        <QuickAction icon={<FunctionSquare className="h-2.5 w-2.5" />} label="Equations" onClick={() => askAbout(`Give me the equations for ${selected.name}.`)} />
      </div>

      {/* body */}
      <div className="flex-1 overflow-y-auto px-3 py-2.5 text-slate-300">
        {selected.context && (
          <Section title="In this plant">
            <p className="text-[11px] leading-relaxed text-slate-400">{selected.context}</p>
          </Section>
        )}

        <Section title="Purpose">
          <p className="text-[11px] leading-relaxed text-slate-400">{meta.purpose}</p>
        </Section>

        <Collapsible title="Working principle" icon={<Wrench className="h-3 w-3" />} defaultOpen>
          <p className="text-[11px] leading-relaxed text-slate-400">{meta.workingPrinciple}</p>
        </Collapsible>

        <Collapsible title="Operating conditions" icon={<Gauge className="h-3 w-3" />}>
          <p className="text-[11px] leading-relaxed text-slate-400">{meta.operatingConditions}</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <div className="rounded border border-slate-800/60 bg-slate-900/40 p-1.5">
              <div className="mb-0.5 text-[8px] font-medium uppercase tracking-wider text-slate-600">In</div>
              <ul className="space-y-0.5 text-[10px] text-slate-400">
                {meta.inputs.map((i, idx) => <li key={idx}>· {i}</li>)}
              </ul>
            </div>
            <div className="rounded border border-slate-800/60 bg-slate-900/40 p-1.5">
              <div className="mb-0.5 text-[8px] font-medium uppercase tracking-wider text-slate-600">Out</div>
              <ul className="space-y-0.5 text-[10px] text-slate-400">
                {meta.outputs.map((o, idx) => <li key={idx}>· {o}</li>)}
              </ul>
            </div>
          </div>
        </Collapsible>

        <Collapsible title="Safety" icon={<AlertTriangle className="h-3 w-3" />}>
          <ul className="space-y-0.5 text-[11px] text-slate-400">
            {meta.safetyConcerns.map((s, idx) => (
              <li key={idx} className="flex gap-1">
                <AlertTriangle className="mt-0.5 h-2.5 w-2.5 flex-shrink-0 text-amber-400" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </Collapsible>

        <Collapsible title="Failure modes" icon={<Wrench className="h-3 w-3" />}>
          <ul className="space-y-0.5 text-[11px] text-slate-400">
            {meta.failureModes.map((f, idx) => <li key={idx}>· {f}</li>)}
          </ul>
        </Collapsible>

        <Collapsible title="Equations" icon={<FunctionSquare className="h-3 w-3" />}>
          <div className="space-y-1.5">
            {meta.equations.map((e, idx) => (
              <div key={idx} className="rounded border border-slate-800/60 bg-slate-900/40 p-1.5">
                <div className="text-[10px] font-medium text-sky-300">{e.name}</div>
                <div className="my-1 font-mono text-[10px] text-amber-300">{e.formula}</div>
                <div className="text-[10px] leading-relaxed text-slate-500">{e.description}</div>
              </div>
            ))}
          </div>
        </Collapsible>

        <Collapsible title="Interview Qs" icon={<HelpCircle className="h-3 w-3" />}>
          <ol className="list-decimal space-y-0.5 pl-3.5 text-[11px] text-slate-400">
            {meta.interviewQuestions.map((q, idx) => <li key={idx}>{q}</li>)}
          </ol>
        </Collapsible>
      </div>
    </div>
  );
}

function QuickAction({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-1 items-center justify-center gap-1 rounded border border-slate-800/60 bg-slate-900/40 px-1.5 py-1 text-[10px] font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
    >
      {icon}
      {label}
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-2">
      <h3 className="mb-1 text-[9px] font-medium uppercase tracking-wider text-slate-600">{title}</h3>
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
    <div className="border-t border-slate-800/60 pt-1.5 pb-1">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between py-0.5 text-left"
      >
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-300">
          <span className="text-slate-600">{icon}</span>
          {title}
        </span>
        {open ? <ChevronDown className="h-3 w-3 text-slate-600" /> : <ChevronRight className="h-3 w-3 text-slate-600" />}
      </button>
      {open && <div className="mt-1 pb-1">{children}</div>}
    </div>
  );
}
