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
    <main className="relative h-screen w-screen overflow-hidden bg-[#08090c] text-white">
      {/* 3D scene fills the screen */}
      <div className="absolute inset-0">
        <PlantCanvas />
      </div>

      {/* welcome screen overlay until a plant is built */}
      {(!currentPlant || isGenerating) && (
        <WelcomeScreen onBuild={handleBuild} />
      )}

      {/* HUD overlay once a plant is loaded — everything absolutely positioned, no scroll */}
      {currentPlant && !isGenerating && (
        <>
          {/* top-left: header */}
          <div className="pointer-events-auto absolute left-0 right-0 top-0 z-10">
            <Header />
          </div>

          {/* top-center: tour indicator */}
          <div className="pointer-events-none absolute left-1/2 top-14 z-10 -translate-x-1/2">
            <TourIndicator />
          </div>

          {/* right: equipment panel */}
          <div className="pointer-events-auto absolute right-3 top-12 z-10">
            <EquipmentPanel />
          </div>

          {/* left: chat (collapsed by default) */}
          <div className="pointer-events-auto absolute left-3 bottom-3 z-10">
            <ChatPanel onSend={handleSend} busy={busy} />
          </div>

          {/* center-bottom: caption bar (above voice) */}
          <CaptionBar />

          {/* center-bottom: voice + commands */}
          <div className="pointer-events-auto absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2">
            <CommandBar onCommand={handleSend} />
            <VoiceButton onTranscript={handleSend} />
          </div>
        </>
      )}
    </main>
  );
}
