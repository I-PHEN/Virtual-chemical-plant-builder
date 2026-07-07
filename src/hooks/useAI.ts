"use client";

import { useAppStore } from "@/lib/store/useAppStore";
import { getPlantById } from "@/lib/plant/templates";
import { useCallback } from "react";
import type { AssistantAction, ChatMessage, DisplayState, EquipmentType } from "@/lib/plant/types";

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

/**
 * Central hook that orchestrates user input → AI → store updates.
 * Sends the user's text to /api/chat, applies the returned action to the
 * store, and speaks the assistant's reply via the global __plantSpeak
 * function set up by VoiceButton.
 */
export function useAIConversation() {
  const addMessage = useAppStore((s) => s.addMessage);
  const focusEquipment = useAppStore((s) => s.focusEquipment);
  const setHighlight = useAppStore((s) => s.setHighlight);
  const setDisplayStateByType = useAppStore((s) => s.setDisplayStateByType);
  const showAll = useAppStore((s) => s.showAll);
  const setTourStep = useAppStore((s) => s.setTourStep);
  const selectEquipment = useAppStore((s) => s.selectEquipment);

  const send = useCallback(
    async (text: string) => {
      const state = useAppStore.getState();
      const plantId = state.currentPlant?.id ?? null;
      const selectedEquipmentId = state.selectedEquipmentId;

      const history = state.messages
        .filter((m) => m.role !== "system")
        .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

      // push user message
      const userMsg: ChatMessage = {
        id: uid(),
        role: "user",
        content: text,
        timestamp: Date.now(),
      };
      addMessage(userMsg);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plantId,
            selectedEquipmentId,
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

        // speak the reply
        const speak = (window as any).__plantSpeak as ((t: string) => void) | undefined;
        if (speak) speak(data.text);

        // apply the action
        if (data.action) applyAction(data.action, { selectEquipment, focusEquipment, setHighlight, setDisplayStateByType, showAll, setTourStep });
      } catch (err) {
        console.error("[chat] failed", err);
        addMessage({
          id: uid(),
          role: "assistant",
          content:
            "I couldn't reach the AI service just then. Please check your connection and try again.",
          timestamp: Date.now(),
        });
      }
    },
    [addMessage, focusEquipment, setHighlight, setDisplayStateByType, showAll, setTourStep, selectEquipment]
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
    case "quiz":
      // quiz is conversational; no scene change needed
      break;
  }
}

/**
 * Builds a plant from a natural-language command by calling
 * /api/build-plant, then loads the template into the store and posts a
 * welcome assistant message.
 */
export function usePlantBuilder() {
  const setGenerating = useAppStore((s) => s.setGenerating);
  const setPlant = useAppStore((s) => s.setPlant);
  const addMessage = useAppStore((s) => s.addMessage);

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
          // No matching template
          setGenerating(false);
          addMessage({
            id: uid(),
            role: "assistant",
            content: data.intro,
            timestamp: Date.now(),
          });
          const speak = (window as any).__plantSpeak as ((t: string) => void) | undefined;
          if (speak) speak(data.intro);
          return;
        }

        const template = getPlantById(data.plantId);
        if (!template) {
          setGenerating(false);
          return;
        }

        // small artificial delay so the "Building…" animation is visible
        await new Promise((r) => setTimeout(r, 600));
        setPlant(template, data.intro);
        addMessage({
          id: uid(),
          role: "assistant",
          content: data.intro,
          timestamp: Date.now(),
        });
        const speak = (window as any).__plantSpeak as ((t: string) => void) | undefined;
        if (speak) speak(data.intro);
      } catch (err) {
        console.error("[build-plant] failed", err);
        setGenerating(false);
        addMessage({
          id: uid(),
          role: "assistant",
          content:
            "I had trouble building that plant right now. Please try again in a moment.",
          timestamp: Date.now(),
        });
      }
    },
    [setGenerating, setPlant, addMessage]
  );

  return { build };
}
