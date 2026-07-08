"use client";

import { useEffect, useRef } from "react";
import { useAppStore } from "@/lib/store/useAppStore";
import { useAIConversation } from "@/hooks/useAI";

/**
 * TourAutoAdvance — when the tour is active and auto-advance is on, this
 * hook watches for when the AI finishes speaking OR when a new assistant
 * message arrives (fallback for browsers without TTS). After a delay,
 * it automatically advances to the next tour step and asks the AI to
 * explain it. On the last step, it ends the tour.
 *
 * The student can say "next", "back", "skip", "stop" to control it
 * manually — those are handled by the chat AI.
 */
export function TourAutoAdvance() {
  const tourStep = useAppStore((s) => s.tourStep);
  const tourAutoAdvance = useAppStore((s) => s.tourAutoAdvance);
  const isSpeaking = useAppStore((s) => s.isAssistantSpeaking);
  const messages = useAppStore((s) => s.messages);
  const currentPlant = useAppStore((s) => s.currentPlant);
  const setTourStep = useAppStore((s) => s.setTourStep);
  const selectEquipment = useAppStore((s) => s.selectEquipment);
  const { send } = useAIConversation();

  const wasSpeaking = useRef(false);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastMessageCount = useRef(0);
  const lastMessageTime = useRef(0);

  // Detect new assistant messages (fallback when TTS isn't available)
  useEffect(() => {
    if (tourStep === null || !tourAutoAdvance || !currentPlant) return;

    const msgCount = messages.length;
    const lastMsg = messages[messages.length - 1];

    // If there's a new assistant message and we haven't scheduled advance yet
    if (
      msgCount > lastMessageCount.current &&
      lastMsg?.role === "assistant" &&
      Date.now() - lastMessageTime.current > 1000 // avoid double-trigger
    ) {
      lastMessageCount.current = msgCount;
      lastMessageTime.current = Date.now();

      // Schedule auto-advance after a reading/speaking delay.
      // If TTS is speaking, the speaking-end handler below will handle it.
      // If TTS isn't available, this timer acts as the fallback.
      if (advanceTimer.current) clearTimeout(advanceTimer.current);

      const total = currentPlant.processSteps.length;
      const isLastStep = tourStep >= total - 1;

      advanceTimer.current = setTimeout(() => {
        // Double-check that TTS isn't still speaking — if it is, wait more
        const state = useAppStore.getState();
        if (state.isAssistantSpeaking) {
          // Reschedule — the speaking-end handler will take over
          return;
        }

        if (isLastStep) {
          setTourStep(null);
          selectEquipment(null);
        } else {
          const next = (state.tourStep ?? tourStep) + 1;
          const nextStep = currentPlant.processSteps[next];
          if (nextStep) {
            setTourStep(next);
            selectEquipment(nextStep.equipmentId);
            send(`Explain step ${nextStep.order}: ${nextStep.title}.`);
          }
        }
      }, 6000); // 6 second delay to let the AI finish speaking
    }
  }, [messages, tourStep, tourAutoAdvance, currentPlant, setTourStep, selectEquipment, send]);

  // Also detect TTS speaking → not-speaking transition
  useEffect(() => {
    if (tourStep === null || !tourAutoAdvance || !currentPlant) {
      wasSpeaking.current = false;
      return;
    }

    if (wasSpeaking.current && !isSpeaking) {
      wasSpeaking.current = false;

      if (advanceTimer.current) clearTimeout(advanceTimer.current);

      const total = currentPlant.processSteps.length;
      const isLastStep = tourStep >= total - 1;

      advanceTimer.current = setTimeout(() => {
        if (isLastStep) {
          setTourStep(null);
          selectEquipment(null);
        } else {
          const next = tourStep + 1;
          const nextStep = currentPlant.processSteps[next];
          if (nextStep) {
            setTourStep(next);
            selectEquipment(nextStep.equipmentId);
            send(`Explain step ${nextStep.order}: ${nextStep.title}.`);
          }
        }
      }, 2000);
    }

    if (isSpeaking) {
      wasSpeaking.current = true;
    }

    return () => {
      if (advanceTimer.current) {
        clearTimeout(advanceTimer.current);
        advanceTimer.current = null;
      }
    };
  }, [isSpeaking, tourStep, tourAutoAdvance, currentPlant, setTourStep, selectEquipment, send]);

  return null;
}
