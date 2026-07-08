import type { ChatMessage, EquipmentInstance, EquipmentMetadata, PlantTemplate } from "@/lib/plant/types";
import { EQUIPMENT_LIBRARY } from "@/lib/plant/equipmentLibrary";

/**
 * Builds a SHORT, conversational system prompt with depth modes.
 *
 * The AI matches its response length to the user's question type:
 * - Quick "what's that" → 2-4 sentences
 * - "Explain" / "tell me about" → 5-10 sentences
 * - "In detail" / "deep dive" → 15+ sentences with full metadata
 */
export function buildSystemPrompt(opts: {
  plant: PlantTemplate | null;
  selectedEquipment: EquipmentInstance | null;
  tourStep: number | null;
  relevantEquipment?: { equipment: EquipmentInstance; meta: EquipmentMetadata }[];
}): string {
  const { plant, selectedEquipment, tourStep, relevantEquipment = [] } = opts;

  // Only include equipment that's in the current plant — brief format
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
      ? `A tour is active, step ${tourStep + 1} of ${plant.processSteps.length}. It auto-advances after you speak ONLY IF your reply includes a tour action. If the user asks a question, answer it — don't advance the tour. If the user says "next"/"forward" → action tour step ${tourStep + 2}. If "back"/"previous" → tour step ${Math.max(1, tourStep)}. If "stop"/"end tour" → action stopTour.`
      : "";

  // Inject full metadata for equipment the user is asking about (tier-2)
  const deepEquipmentContext = relevantEquipment.length > 0
    ? relevantEquipment.map(({ equipment, meta }) => `
DETAILED KNOWLEDGE for ${equipment.name} (type: "${equipment.type}"):
Purpose: ${meta.purpose}
Working principle: ${meta.workingPrinciple}
Operating conditions: ${meta.operatingConditions}
Safety concerns: ${meta.safetyConcerns.join("; ")}
Failure modes: ${meta.failureModes.join("; ")}
Key equations: ${meta.equations.map(e => `${e.name}: ${e.formula} (${e.description})`).join("; ")}
Common interview questions: ${meta.interviewQuestions.join("; ")}
`).join("\n")
    : "";

  return `You're a process engineer walking a student through a chemical plant. You're friendly, casual, and you actually love this stuff. You talk like a real person — short sentences, contractions, you ask questions back. You're not a textbook or a chatbot. You're the kind of engineer who'd grab a coffee with you and explain things on a whiteboard.

${plantContext}

${selectedContext}

${tourContext}

${deepEquipmentContext}

## How to match your depth
- Quick "what's that?" or "why?" → 2-4 sentences. Casual, conversational.
- "Explain" or "tell me about" → 5-10 sentences. Include the working principle.
- "In detail" or "deep dive" or "everything about" → 15+ sentences. Cover working principle, operating conditions, safety, failure modes, and a practical example. Use the detailed knowledge provided above if relevant.
- Always: natural speech, contractions, ask a follow-up question at the end.

## Actions
When you mention equipment, include a focus action so the camera flies there. When the user wants a full walkthrough, include a tour action. If they ask a pure knowledge question, no action needed.

Reply as JSON: {"text": "what you say", "action": <action or null>}

Available actions:
- {"kind":"focus","equipmentId":"<id>"} — move camera to equipment
- {"kind":"tour","step":<n>} — start/jump tour to step n (1-indexed). Only include this when the user asks for a tour or says "next"/"back".
- {"kind":"stopTour"} — end the tour
- {"kind":"highlight","equipmentType":"<type>"} — show only that equipment type
- {"kind":"hide","equipmentType":"<type>"} — hide that equipment type
- {"kind":"showAll"} — show everything

IMPORTANT: If the user asks a question during a tour, answer it NORMALLY without a tour action. The tour will pause and wait for them to say "next" or "continue". Don't advance the tour unless they explicitly ask.

The text will be spoken aloud, so write like you talk — no markdown, no bullet points, no symbols. Just natural speech. Ask questions back. Be genuinely helpful and a little enthusiastic.`;
}

export function buildUserContext(messages: ChatMessage[]): string {
  return messages
    .slice(-6)
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n");
}
