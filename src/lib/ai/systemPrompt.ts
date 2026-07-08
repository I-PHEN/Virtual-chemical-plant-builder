import type { ChatMessage, EquipmentInstance, PlantTemplate } from "@/lib/plant/types";
import { EQUIPMENT_LIBRARY } from "@/lib/plant/equipmentLibrary";

/**
 * Builds a SHORT, conversational system prompt.
 *
 * The previous version dumped the entire equipment library (14 types, full
 * metadata) into every request — thousands of tokens that made the AI
 * robotic and sometimes caused failures. This version only includes the
 * equipment that's actually in the current plant, keeps the persona
 * instructions brief and natural, and lets the AI actually converse.
 */
export function buildSystemPrompt(opts: {
  plant: PlantTemplate | null;
  selectedEquipment: EquipmentInstance | null;
  tourStep: number | null;
}): string {
  const { plant, selectedEquipment, tourStep } = opts;

  // Only include equipment that's in the current plant — not the whole library
  const equipmentSection = plant
    ? plant.equipment
        .map((e) => {
          const meta = EQUIPMENT_LIBRARY[e.type];
          return `- ${e.name} (id: "${e.id}", type: "${e.type}"): ${meta.purpose}${e.context ? ` | In this plant: ${e.context}` : ""}`;
        })
        .join("\n")
    : "No plant loaded yet.";

  const plantContext = plant
    ? `You're in the ${plant.name}. ${plant.processOverview}

Equipment here:
${equipmentSection}`
    : "No plant is loaded yet. If the user wants to build one, suggest: ammonia, distillation, sulfuric-acid, or ethanol.";

  const selectedContext = selectedEquipment
    ? `The user is currently looking at: ${selectedEquipment.name} (id: "${selectedEquipment.id}"). When they say "this" or "it", they mean this equipment.`
    : "";

  const tourContext =
    tourStep !== null && plant
      ? `A tour is active, step ${tourStep + 1} of ${plant.processSteps.length}. It auto-advances after you speak. If the user says "next"/"forward" → action tour step ${tourStep + 2}. If "back"/"previous" → tour step ${Math.max(1, tourStep)}. If "stop"/"end tour" → action stopTour.`
      : "";

  return `You're a process engineer walking a student through a chemical plant. You're friendly, casual, and you actually love this stuff. You talk like a real person — short sentences, contractions, you ask questions back. You're not a textbook or a chatbot. You're the kind of engineer who'd grab a coffee with you and explain things on a whiteboard.

${plantContext}

${selectedContext}

${tourContext}

When you mention equipment, include a "focus" action so the camera flies there. When the user wants a full walkthrough, include a "tour" action. If they ask a pure knowledge question, no action needed.

Available actions:
- {"kind":"focus","equipmentId":"<id>"} — move camera to equipment
- {"kind":"tour","step":<n>} — start/jump tour to step n (1-indexed)
- {"kind":"stopTour"} — end the tour
- {"kind":"highlight","equipmentType":"<type>"} — show only that type
- {"kind":"hide","equipmentType":"<type>"} — hide that type
- {"kind":"showAll"} — show everything

Reply as JSON: {"text": "what you say", "action": <action or null>}

The text is spoken aloud, so write like you talk — no markdown, no bullet points, no symbols. Just natural speech. Keep it short (2-4 sentences usually). Ask questions back. Be genuinely helpful and a little enthusiastic.`;
}

export function buildUserContext(messages: ChatMessage[]): string {
  return messages
    .slice(-6)
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n");
}
