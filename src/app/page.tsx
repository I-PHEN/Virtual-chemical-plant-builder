"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { useAppStore } from "@/lib/store/useAppStore";
import { useAIConversation, usePlantBuilder } from "@/hooks/useAI";
import { WelcomeScreen } from "@/components/ui-overlay/WelcomeScreen";
import { Header } from "@/components/ui-overlay/Header";
import { ChatPanel } from "@/components/ui-overlay/ChatPanel";
import { EquipmentPanel } from "@/components/ui-overlay/EquipmentPanel";
import { CommandBar } from "@/components/ui-overlay/CommandBar";
import { VoiceButton } from "@/components/ui-overlay/VoiceButton";
import { TourIndicator } from "@/components/ui-overlay/TourIndicator";

// React Three Fiber requires WebGL — load the canvas only on the client.
const PlantCanvas = dynamic(
  () => import("@/components/scene/PlantCanvas").then((m) => m.PlantCanvas),
  { ssr: false }
);

export default function Home() {
  const currentPlant = useAppStore((s) => s.currentPlant);
  const isGenerating = useAppStore((s) => s.isGenerating);
  const [busy, setBusy] = useState(false);

  const { build } = usePlantBuilder();
  const { send } = useAIConversation();

  const handleBuild = useCallback(
    async (command: string) => {
      await build(command);
    },
    [build]
  );

  const handleSend = useCallback(
    async (text: string) => {
      setBusy(true);
      try {
        await send(text);
      } finally {
        setBusy(false);
      }
    },
    [send]
  );

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-slate-950 text-white">
      {/* 3D scene always mounted underneath (so transitions are smooth) */}
      <div className="absolute inset-0">
        <PlantCanvas />
      </div>

      {/* welcome screen overlay until a plant is built */}
      {(!currentPlant || isGenerating) && (
        <WelcomeScreen onBuild={handleBuild} />
      )}

      {/* HUD overlay once a plant is loaded */}
      {currentPlant && !isGenerating && (
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
          {/* top bar */}
          <div className="pointer-events-auto">
            <Header />
          </div>

          {/* middle row: left chat, right equipment panel */}
          <div className="pointer-events-none flex flex-1 items-start justify-between gap-4 px-4 pt-2">
            <div className="flex flex-col gap-3">
              <ChatPanel onSend={handleSend} busy={busy} />
            </div>
            <div className="flex flex-col gap-3">
              <EquipmentPanel />
            </div>
          </div>

          {/* tour indicator (top-center under header) */}
          <div className="pointer-events-none absolute left-1/2 top-20 -translate-x-1/2">
            <TourIndicator />
          </div>

          {/* bottom: voice button + command bar */}
          <div className="pointer-events-none flex flex-col items-center gap-3 px-4 pb-5">
            <CommandBar onCommand={handleSend} />
            <VoiceButton onTranscript={handleSend} />
          </div>
        </div>
      )}
    </main>
  );
}
