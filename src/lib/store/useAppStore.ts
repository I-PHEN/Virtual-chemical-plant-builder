"use client";

import { create } from "zustand";
import type {
  ChatMessage,
  DisplayState,
  EquipmentInstance,
  EquipmentType,
  PlantTemplate,
} from "@/lib/plant/types";

interface AppState {
  // Plant state
  currentPlant: PlantTemplate | null;
  plantIntro: string;
  isGenerating: boolean;

  // Equipment display
  displayStates: Record<string, DisplayState>; // by equipment id
  selectedEquipmentId: string | null;
  focusEquipmentId: string | null; // camera target
  highlightType: EquipmentType | null; // "show only reactors" etc.

  // Tour
  tourStep: number | null;

  // Chat
  messages: ChatMessage[];
  isAssistantSpeaking: boolean;
  isListening: boolean;
  voiceEnabled: boolean;
  /** The text the AI is currently speaking (shown as a live caption) */
  currentCaption: string;

  // Actions
  setPlant: (plant: PlantTemplate, intro: string) => void;
  setGenerating: (v: boolean) => void;
  selectEquipment: (id: string | null) => void;
  focusEquipment: (id: string | null) => void;
  setHighlight: (type: EquipmentType | null) => void;
  setDisplayState: (id: string, state: DisplayState) => void;
  setDisplayStateByType: (type: EquipmentType, state: DisplayState) => void;
  showAll: () => void;
  setTourStep: (step: number | null) => void;
  addMessage: (msg: ChatMessage) => void;
  clearMessages: () => void;
  setAssistantSpeaking: (v: boolean) => void;
  setListening: (v: boolean) => void;
  setVoiceEnabled: (v: boolean) => void;
  setCurrentCaption: (v: string) => void;
  resetPlant: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentPlant: null,
  plantIntro: "",
  isGenerating: false,

  displayStates: {},
  selectedEquipmentId: null,
  focusEquipmentId: null,
  highlightType: null,

  tourStep: null,

  messages: [],
  isAssistantSpeaking: false,
  isListening: false,
  voiceEnabled: true,
  currentCaption: "",

  setPlant: (plant, intro) =>
    set({
      currentPlant: plant,
      plantIntro: intro,
      isGenerating: false,
      displayStates: Object.fromEntries(
        plant.equipment.map((e) => [e.id, "visible" as DisplayState])
      ),
      selectedEquipmentId: null,
      focusEquipmentId: null,
      highlightType: null,
      tourStep: null,
      messages: [],
    }),

  setGenerating: (v) => set({ isGenerating: v }),

  selectEquipment: (id) => set({ selectedEquipmentId: id }),

  focusEquipment: (id) => set({ focusEquipmentId: id }),

  setHighlight: (type) => {
    const { currentPlant } = get();
    if (!currentPlant) return;
    const newStates: Record<string, DisplayState> = {};
    for (const eq of currentPlant.equipment) {
      if (type === null) newStates[eq.id] = "visible";
      else if (eq.type === type) newStates[eq.id] = "highlighted";
      else newStates[eq.id] = "hidden";
    }
    set({ displayStates: newStates, highlightType: type });
  },

  setDisplayState: (id, state) =>
    set((s) => ({ displayStates: { ...s.displayStates, [id]: state } })),

  setDisplayStateByType: (type, state) => {
    const { currentPlant } = get();
    if (!currentPlant) return;
    set((s) => ({
      displayStates: {
        ...s.displayStates,
        ...Object.fromEntries(
          currentPlant.equipment
            .filter((e) => e.type === type)
            .map((e) => [e.id, state])
        ),
      },
    }));
  },

  showAll: () => {
    const { currentPlant } = get();
    if (!currentPlant) return;
    set({
      displayStates: Object.fromEntries(
        currentPlant.equipment.map((e) => [e.id, "visible" as DisplayState])
      ),
      highlightType: null,
    });
  },

  setTourStep: (step) => set({ tourStep: step }),

  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),

  clearMessages: () => set({ messages: [] }),

  setAssistantSpeaking: (v) => {
    set({ isAssistantSpeaking: v });
    if (!v) set({ currentCaption: "" });
  },
  setListening: (v) => set({ isListening: v }),
  setVoiceEnabled: (v) => set({ voiceEnabled: v }),
  setCurrentCaption: (v) => set({ currentCaption: v }),

  resetPlant: () =>
    set({
      currentPlant: null,
      plantIntro: "",
      isGenerating: false,
      displayStates: {},
      selectedEquipmentId: null,
      focusEquipmentId: null,
      highlightType: null,
      tourStep: null,
      messages: [],
      currentCaption: "",
    }),
}));

// Selector helper: returns the currently selected EquipmentInstance
export function useSelectedEquipment(): EquipmentInstance | null {
  return useAppStore((s) => {
    if (!s.currentPlant || !s.selectedEquipmentId) return null;
    return (
      s.currentPlant.equipment.find((e) => e.id === s.selectedEquipmentId) ?? null
    );
  });
}
