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
import { CaptionBar } from "@/components/ui-overlay/CaptionBar";

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

          {/* middle row: equipment panel on the right (chat is collapsed by default) */}
          <div className="pointer-events-none flex flex-1 items-start justify-end gap-4 px-4 pt-2">
            <EquipmentPanel />
          </div>

          {/* tour indicator (top-center under header) */}
          <div className="pointer-events-none absolute left-1/2 top-20 -translate-x-1/2">
            <TourIndicator />
          </div>

          {/* live caption bar — primary text interface while AI speaks */}
          <CaptionBar />

          {/* bottom: voice button (primary) + command bar + collapsed chat */}
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 flex items-end justify-between gap-4 px-4 pb-5">
            {/* left: chat (collapsed by default — voice first) */}
            <div className="pointer-events-auto">
              <ChatPanel onSend={handleSend} busy={busy} />
            </div>

            {/* center: voice + commands */}
            <div className="pointer-events-auto flex flex-col items-center gap-3">
              <CommandBar onCommand={handleSend} />
              <VoiceButton onTranscript={handleSend} />
            </div>

            {/* right: spacer to balance layout */}
            <div className="w-[52px]" />
          </div>
        </div>
      )}
    </main>
  );
}
