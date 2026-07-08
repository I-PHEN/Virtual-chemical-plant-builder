"use client";

import { useState, useEffect } from "react";
import { X, Volume2, VolumeX, Gauge, RadioTower, Mic } from "lucide-react";
import { useAppStore } from "@/lib/store/useAppStore";

interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsDrawer({ open, onClose }: SettingsDrawerProps) {
  const voiceEnabled = useAppStore((s) => s.voiceEnabled);
  const setVoiceEnabled = useAppStore((s) => s.setVoiceEnabled);

  const [voiceSpeed, setVoiceSpeed] = useState<number>(() => {
    if (typeof window === "undefined") return 1.0;
    const saved = localStorage.getItem("plant-voice-speed");
    return saved ? parseFloat(saved) : 1.0;
  });
  const [handsFreeDefault, setHandsFreeDefault] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const saved = localStorage.getItem("plant-hands-free-default");
    return saved === null ? true : saved === "true";
  });

  // Persist settings
  useEffect(() => {
    localStorage.setItem("plant-voice-speed", voiceSpeed.toString());
  }, [voiceSpeed]);

  useEffect(() => {
    localStorage.setItem("plant-hands-free-default", handsFreeDefault.toString());
  }, [handsFreeDefault]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* drawer */}
      <div className="relative h-full w-[320px] border-l border-slate-800 bg-[#0d0f14] shadow-2xl">
        {/* header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
          <h2 className="text-[13px] font-medium text-slate-200">Settings</h2>
          <button
            onClick={onClose}
            aria-label="Close settings"
            className="rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* body */}
        <div className="space-y-5 p-4">
          {/* Voice toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-800/60">
                {voiceEnabled ? <Volume2 className="h-3.5 w-3.5 text-sky-400" /> : <VolumeX className="h-3.5 w-3.5 text-slate-500" />}
              </div>
              <div>
                <div className="text-[12px] font-medium text-slate-200">AI Voice</div>
                <div className="text-[10px] text-slate-500">Let the AI speak aloud</div>
              </div>
            </div>
            <Toggle checked={voiceEnabled} onChange={setVoiceEnabled} />
          </div>

          {/* Voice speed */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-800/60">
                  <Gauge className="h-3.5 w-3.5 text-sky-400" />
                </div>
                <div>
                  <div className="text-[12px] font-medium text-slate-200">Voice Speed</div>
                  <div className="text-[10px] text-slate-500">{voiceSpeed.toFixed(1)}x</div>
                </div>
              </div>
            </div>
            <input
              type="range"
              min="0.7"
              max="1.3"
              step="0.1"
              value={voiceSpeed}
              onChange={(e) => setVoiceSpeed(parseFloat(e.target.value))}
              className="w-full accent-sky-400"
            />
            <div className="mt-1 flex justify-between text-[9px] text-slate-600">
              <span>0.7x</span>
              <span>1.0x</span>
              <span>1.3x</span>
            </div>
          </div>

          {/* Hands-free default */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-800/60">
                <RadioTower className="h-3.5 w-3.5 text-emerald-400" />
              </div>
              <div>
                <div className="text-[12px] font-medium text-slate-200">Hands-free by default</div>
                <div className="text-[10px] text-slate-500">Auto-listen when plant loads</div>
              </div>
            </div>
            <Toggle checked={handsFreeDefault} onChange={setHandsFreeDefault} />
          </div>

          {/* Mic note */}
          <div className="rounded-md border border-slate-800 bg-slate-900/40 p-2.5">
            <div className="flex items-start gap-2">
              <Mic className="mt-0.5 h-3 w-3 flex-shrink-0 text-slate-600" />
              <p className="text-[10px] leading-relaxed text-slate-500">
                Voice input works best in Chrome or Edge. The mic automatically pauses while the AI speaks.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative h-5 w-9 rounded-full transition-colors ${
        checked ? "bg-sky-500" : "bg-slate-700"
      }`}
      aria-pressed={checked}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
          checked ? "translate-x-4" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
