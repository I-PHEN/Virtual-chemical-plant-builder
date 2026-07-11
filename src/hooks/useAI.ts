"use client";

import { useAppStore } from "@/lib/store/useAppStore";
import { useCallback } from "react";
import type { AssistantAction, ChatMessage, DisplayState, EquipmentType, PlantBuilderResult, PlantTemplate } from "@/lib/plant/types";

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
 *
 * Flow:
 *   1. POST /api/build-plant → AI picks the knowledge template, layout engine
 *      computes the full PlantTemplate, returns it.
 *   2. Save the plant to localStorage so a refresh doesn't lose it.
 *   3. setPlant() loads it into the store (scene renders immediately).
 *   4. The WelcomeScreen kicks off narration generation in parallel.
 *
 * The "you can leave, we'll notify you" UX lives in WelcomeScreen, not here —
 * this hook just produces the plant.
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
        const data = (await res.json()) as PlantBuilderResult;

        if (!data.plantId || !data.plant) {
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

        // Checkpoint to localStorage so a refresh doesn't lose the build
        try {
          localStorage.setItem(
            "plant-explorer:current-plant",
            JSON.stringify({
              plant: data.plant,
              intro: data.intro,
              stages: data.stages,
              equipmentCount: data.equipmentCount,
              builtAt: Date.now(),
              command,
            })
          );
        } catch (e) {
          // localStorage can fail (private mode, quota) — non-fatal
          console.warn("[build-plant] could not checkpoint to localStorage", e);
        }

        // Load the plant (keep isGenerating true — WelcomeScreen clears it
        // after narration is done)
        setPlant(data.plant, data.intro);

        // Speak the intro via the voice system
        const speak = (window as any).__plantSpeak as ((t: string) => void) | undefined;
        if (speak) speak(data.intro);
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

/**
 * Restore a previously-built plant from localStorage. Called on app startup
 * so the "you can leave" UX actually works — refresh and the plant is still
 * there, ready for the user to enter.
 *
 * Returns the plant + intro if found, null otherwise. The caller decides
 * whether to enter the simulation directly or show the welcome screen with
 * a "your plant is ready" message.
 */
export function usePlantRestorer(): {
  restore: () => { plant: PlantTemplate; intro: string } | null;
  clear: () => void;
} {
  const restore = useCallback(() => {
    try {
      const raw = localStorage.getItem("plant-explorer:current-plant");
      if (!raw) return null;
      const data = JSON.parse(raw) as {
        plant: PlantTemplate;
        intro: string;
      };
      if (!data.plant || !data.plant.id) return null;
      return { plant: data.plant, intro: data.intro };
    } catch {
      return null;
    }
  }, []);

  const clear = useCallback(() => {
    try {
      localStorage.removeItem("plant-explorer:current-plant");
    } catch {
      // ignore
    }
  }, []);

  return { restore, clear };
}
