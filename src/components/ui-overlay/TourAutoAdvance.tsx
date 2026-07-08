"use client";

import { useEffect, useRef } from "react";
import { useAppStore } from "@/lib/store/useAppStore";
import { useAIConversation } from "@/hooks/useAI";

/**
 * TourAutoAdvance — SMART version.
 *
 * The critical fix: the tour only auto-advances when the AI's last reply
 * was a TOUR NARRATION (action kind "tour"). If the AI answered a user
 * question (no tour action), the tour PAUSES and waits for the user to
 * say "next", "continue", or stay silent for 15 seconds before gently
 * prompting to resume.
 *
 * This prevents the "AI ignores my question and moves on" bug.
 */
export function TourAutoAdvance() {
  const tourStep = useAppStore((s) => s.tourStep);
  const tourAutoAdvance = useAppStore((s) => s.tourAutoAdvance);
  const isSpeaking = useAppStore((s) => s.isAssistantSpeaking);
  const lastAssistantActionKind = useAppStore((s) => s.lastAssistantActionKind);
  const lastUserMessageAt = useAppStore((s) => s.lastUserMessageAt);
  const messages = useAppStore((s) => s.messages);
  const currentPlant = useAppStore((s) => s.currentPlant);
  const setTourStep = useAppStore((s) => s.setTourStep);
  const selectEquipment = useAppStore((s) => s.selectEquipment);
  const { send } = useAIConversation();

  const wasSpeaking = useRef(false);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (tourStep === null || !tourAutoAdvance || !currentPlant) {
      wasSpeaking.current = false;
      return;
    }

    // Detect speaking → not-speaking transition
    if (wasSpeaking.current && !isSpeaking) {
      wasSpeaking.current = false;

      // Clear any pending timers
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
      if (resumeTimer.current) clearTimeout(resumeTimer.current);

      // KEY LOGIC: only auto-advance if the AI was narrating a tour step.
      // If the AI answered a user question (no tour action), DON'T advance —
      // the user's question should not be cut off.
      const wasTourNarration = lastAssistantActionKind === "tour";

      if (wasTourNarration) {
        // AI just narrated a tour step — advance after 3 seconds
        advanceTimer.current = setTimeout(() => {
          const total = currentPlant.processSteps.length;
          const isLastStep = tourStep >= total - 1;

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
        }, 3000);
      } else {
        // AI answered a user question — DON'T auto-advance.
        // Wait 15 seconds; if the user doesn't say anything, gently prompt.
        resumeTimer.current = setTimeout(() => {
          // Check if the user spoke since the AI finished
          const timeSinceUser = Date.now() - lastUserMessageAt;
          if (timeSinceUser > 14000) {
            // User has been silent — gently offer to resume
            send("Want me to keep going with the tour, or should we dig deeper here?");
          }
          // If the user spoke, they're driving — don't interrupt
        }, 15000);
      }
    }

    if (isSpeaking) {
      wasSpeaking.current = true;
    }

    return () => {
      if (advanceTimer.current) {
        clearTimeout(advanceTimer.current);
        advanceTimer.current = null;
      }
      if (resumeTimer.current) {
        clearTimeout(resumeTimer.current);
        resumeTimer.current = null;
      }
    };
  }, [isSpeaking, tourStep, tourAutoAdvance, currentPlant, lastAssistantActionKind, lastUserMessageAt, setTourStep, selectEquipment, send]);

  // If the user sends a new message, cancel any pending resume prompt
  useEffect(() => {
    if (lastUserMessageAt > 0 && resumeTimer.current) {
      clearTimeout(resumeTimer.current);
      resumeTimer.current = null;
    }
  }, [lastUserMessageAt]);

  return null;
}
