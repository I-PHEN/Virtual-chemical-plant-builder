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
    <div className="pointer-events-auto flex max-h-[calc(100vh-8rem)] w-[340px] flex-col overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900/80 shadow-2xl ring-1 ring-white/5 backdrop-blur-xl">
      {/* header */}
      <div
        className="relative flex items-start justify-between gap-2 px-4 py-3.5"
        style={{
          background: `linear-gradient(135deg, ${meta.color}26, transparent 70%)`,
        }}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ background: meta.color, boxShadow: `0 0 8px ${meta.color}` }}
            />
            <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
              {meta.category}
            </span>
          </div>
          <h2 className="mt-1 truncate text-base font-semibold text-white">{selected.name}</h2>
          <p className="text-xs text-slate-400">{meta.singularName}</p>
          <p className="mt-0.5 text-[11px] italic text-slate-500">{meta.tagline}</p>
        </div>
        <button
          onClick={() => selectEquipment(null)}
          aria-label="Close panel"
          className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* quick actions */}
      <div className="flex gap-1.5 border-y border-slate-700/40 bg-slate-950/40 px-3 py-2">
        <QuickAction
          icon={<Crosshair className="h-3 w-3" />}
          label="Focus"
          onClick={() => focusEquipment(selected.id)}
        />
        <QuickAction
          icon={<HelpCircle className="h-3 w-3" />}
          label="Explain"
          onClick={() => askAbout(`Explain ${selected.name}.`)}
        />
        <QuickAction
          icon={<FunctionSquare className="h-3 w-3" />}
          label="Equations"
          onClick={() => askAbout(`Give me the equations for ${selected.name}.`)}
        />
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
          <div className="mt-2.5 grid grid-cols-2 gap-2.5">
            <div className="rounded-lg bg-slate-800/40 p-2">
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Inputs</div>
              <ul className="space-y-0.5 text-xs text-slate-300">
                {meta.inputs.map((i, idx) => (
                  <li key={idx}>• {i}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg bg-slate-800/40 p-2">
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Outputs</div>
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
              <div key={idx} className="rounded-lg border border-slate-700/50 bg-slate-800/40 p-2.5">
                <div className="text-[11px] font-semibold text-sky-300">{e.name}</div>
                <div className="my-1.5 font-mono text-xs text-amber-300">{e.formula}</div>
                <div className="text-[11px] leading-relaxed text-slate-400">{e.description}</div>
              </div>
            ))}
          </div>
        </Collapsible>

        <Collapsible title="Interview questions" icon={<HelpCircle className="h-3.5 w-3.5" />}>
          <ol className="list-decimal space-y-1 pl-4 text-xs text-slate-300">
            {meta.interviewQuestions.map((q, idx) => (
              <li key={idx} className="pl-0.5">{q}</li>
            ))}
          </ol>
        </Collapsible>
      </div>
    </div>
  );
}

function QuickAction({
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
      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-700/50 bg-slate-800/40 px-2 py-1.5 text-[11px] font-medium text-slate-200 transition-colors hover:border-sky-500/40 hover:bg-slate-800 hover:text-white"
    >
      {icon}
      {label}
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <h3 className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">{title}</h3>
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
    <div className="mb-1 border-t border-slate-700/40 pt-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between py-1 text-left"
      >
        <span className="flex items-center gap-2 text-xs font-semibold text-slate-200">
          <span className="text-slate-500">{icon}</span>
          {title}
        </span>
        {open ? <ChevronDown className="h-3.5 w-3.5 text-slate-500" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-500" />}
      </button>
      {open && <div className="mt-1 pb-1.5">{children}</div>}
    </div>
  );
}
