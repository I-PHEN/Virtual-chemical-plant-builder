"use client";

import { useAppStore } from "@/lib/store/useAppStore";
import { getPlantById } from "@/lib/plant/templates";
import { useCallback } from "react";
import type { AssistantAction, ChatMessage, DisplayState, EquipmentType } from "@/lib/plant/types";

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

/**
 * Splits text into sentence-sized chunks for TTS.
 * The AI starts speaking the first sentence immediately while subsequent
 * sentences are queued.
 */
function splitIntoSentences(text: string): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+|\S+$/g) || [text];
  return sentences.map(s => s.trim()).filter(s => s.length > 0);
}

/**
 * Central hook that orchestrates user input → AI → store updates.
 * Uses non-streaming API but speaks in sentence chunks for faster
 * perceived response time.
 */
export function useAIConversation() {
  const addMessage = useAppStore((s) => s.addMessage);
  const focusEquipment = useAppStore((s) => s.focusEquipment);
  const setHighlight = useAppStore((s) => s.setHighlight);
  const setDisplayStateByType = useAppStore((s) => s.setDisplayStateByType);
  const showAll = useAppStore((s) => s.showAll);
  const setTourStep = useAppStore((s) => s.setTourStep);
  const selectEquipment = useAppStore((s) => s.selectEquipment);
  const setCurrentCaption = useAppStore((s) => s.setCurrentCaption);
  const markUserMessage = useAppStore((s) => s.markUserMessage);
  const setLastAssistantActionKind = useAppStore((s) => s.setLastAssistantActionKind);

  const send = useCallback(
    async (text: string) => {
      const state = useAppStore.getState();
      const plantId = state.currentPlant?.id ?? null;
      const selectedEquipmentId = state.selectedEquipmentId;
      const tourStep = state.tourStep;

      const history = state.messages
        .filter((m) => m.role !== "system")
        .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

      const userMsg: ChatMessage = {
        id: uid(),
        role: "user",
        content: text,
        timestamp: Date.now(),
      };
      addMessage(userMsg);
      markUserMessage();

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plantId,
            selectedEquipmentId,
            tourStep,
            history,
            message: text,
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { text: string; action: AssistantAction | null };

        const assistantMsg: ChatMessage = {
          id: uid(),
          role: "assistant",
          content: data.text,
          timestamp: Date.now(),
          action: data.action ?? undefined,
        };
        addMessage(assistantMsg);
        setCurrentCaption(data.text);
        setLastAssistantActionKind(data.action?.kind ?? null);

        // Speak the reply in sentence chunks — first sentence starts
        // immediately, rest are queued by the voice engine
        const speak = (window as any).__plantSpeak as ((t: string) => void) | undefined;
        if (speak) speak(data.text);

        if (data.action) {
          applyAction(data.action, { selectEquipment, focusEquipment, setHighlight, setDisplayStateByType, showAll, setTourStep });
        }
      } catch (err) {
        console.error("[chat] failed", err);
        addMessage({
          id: uid(),
          role: "assistant",
          content: "Sorry, I couldn't reach the AI just then. Try again?",
          timestamp: Date.now(),
        });
      }
    },
    [addMessage, focusEquipment, setHighlight, setDisplayStateByType, showAll, setTourStep, selectEquipment, setCurrentCaption, markUserMessage, setLastAssistantActionKind]
  );

  return { send };
}

function applyAction(
  action: AssistantAction,
  handlers: {
    selectEquipment: (id: string | null) => void;
    focusEquipment: (id: string | null) => void;
    setHighlight: (type: EquipmentType | null) => void;
    setDisplayStateByType: (type: EquipmentType, state: DisplayState) => void;
    showAll: () => void;
    setTourStep: (step: number | null) => void;
  }
) {
  switch (action.kind) {
    case "focus":
      handlers.selectEquipment(action.equipmentId);
      handlers.focusEquipment(action.equipmentId);
      break;
    case "highlight":
      if (action.equipmentType) {
        handlers.setHighlight(action.equipmentType);
      } else if (action.equipmentId) {
        handlers.selectEquipment(action.equipmentId);
        handlers.focusEquipment(action.equipmentId);
      }
      break;
    case "hide":
      handlers.setDisplayStateByType(action.equipmentType, "hidden");
      break;
    case "showAll":
      handlers.showAll();
      break;
    case "tour":
      handlers.setTourStep(action.step - 1 < 0 ? 0 : action.step - 1);
      break;
    case "stopTour":
      handlers.setTourStep(null);
      handlers.selectEquipment(null);
      break;
    case "quiz":
      break;
  }
}

/**
 * Builds a plant from a natural-language command.
 */
export function usePlantBuilder() {
  const setGenerating = useAppStore((s) => s.setGenerating);
  const setPlant = useAppStore((s) => s.setPlant);
  const addMessage = useAppStore((s) => s.addMessage);
  const setCurrentCaption = useAppStore((s) => s.setCurrentCaption);

  const build = useCallback(
    async (command: string) => {
      setGenerating(true);
      try {
        const res = await fetch("/api/build-plant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ command }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as {
          plantId: string;
          plantName: string;
          intro: string;
        };

        if (!data.plantId) {
          setGenerating(false);
          addMessage({
            id: uid(),
            role: "assistant",
            content: data.intro,
            timestamp: Date.now(),
          });
          setCurrentCaption(data.intro);
          const speak = (window as any).__plantSpeak as ((t: string) => void) | undefined;
          if (speak) speak(data.intro);
          return;
        }

        const template = getPlantById(data.plantId);
        if (!template) {
          setGenerating(false);
          return;
        }

        await new Promise((r) => setTimeout(r, 400));

        setPlant(template, data.intro);
        addMessage({
          id: uid(),
          role: "assistant",
          content: data.intro,
          timestamp: Date.now(),
        });
        setCurrentCaption(data.intro);
        const speak = (window as any).__plantSpeak as ((t: string) => void) | undefined;
        if (speak) speak(data.intro);
        // Tour narration is now generated in the chat build phase (WelcomeScreen)
        // not here in the simulation.
      } catch (err) {
        console.error("[build-plant] failed", err);
        setGenerating(false);
        addMessage({
          id: uid(),
          role: "assistant",
          content: "I had trouble building that plant. Try again?",
          timestamp: Date.now(),
        });
      }
    },
    [setGenerating, setPlant, addMessage, setCurrentCaption]
  );

  return { build };
}
