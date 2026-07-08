import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import { getPlantById } from "@/lib/plant/templates";
import { buildSystemPrompt } from "@/lib/ai/systemPrompt";
import type { ChatMessage, EquipmentInstance, PlantTemplate, AssistantAction } from "@/lib/plant/types";

export const runtime = "nodejs";
export const maxDuration = 45;

interface ChatRequestBody {
  plantId: string | null;
  selectedEquipmentId: string | null;
  tourStep: number | null;
  history: { role: "user" | "assistant"; content: string }[];
  message: string;
}

function resolveContext(body: ChatRequestBody): {
  plant: PlantTemplate | null;
  selectedEquipment: EquipmentInstance | null;
} {
  const plant = body.plantId ? getPlantById(body.plantId) ?? null : null;
  let selectedEquipment: EquipmentInstance | null = null;
  if (plant && body.selectedEquipmentId) {
    selectedEquipment =
      plant.equipment.find((e) => e.id === body.selectedEquipmentId) ?? null;
  }
  return { plant, selectedEquipment };
}

/**
 * Extracts an action from the AI's text response if it mentioned one.
 * This is a fallback for when the model doesn't return clean JSON.
 */
function extractActionFromText(text: string, plant: PlantTemplate | null): AssistantAction | null {
  if (!plant) return null;
  const lower = text.toLowerCase();

  // Check if the user asked to focus on a specific equipment
  for (const eq of plant.equipment) {
    const eqName = eq.name.toLowerCase();
    const eqType = eq.type.toLowerCase();
    if (lower.includes(eqName) || lower.includes(eqType)) {
      // Don't auto-focus on every mention — only if it seems like the main topic
      // (e.g. "let's go to", "take me to", "look at", "here's the")
      if (lower.includes("let's go") || lower.includes("take me") || lower.includes("look at") ||
          lower.includes("here's") || lower.includes("over to") || lower.includes("head over")) {
        return { kind: "focus", equipmentId: eq.id };
      }
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  let body: ChatRequestBody;
  try {
    body = (await req.json()) as ChatRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { plant, selectedEquipment } = resolveContext(body);
  const systemPrompt = buildSystemPrompt({
    plant,
    selectedEquipment,
    tourStep: body.tourStep ?? null,
  });

  // Build messages — include more history for better conversation
  const conversation: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: systemPrompt },
  ];

  // Include up to 16 messages of history for better conversational context
  for (const m of body.history.slice(-16)) {
    conversation.push({ role: m.role, content: m.content });
  }
  conversation.push({ role: "user", content: body.message });

  try {
    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: conversation,
      temperature: 0.8, // higher = more natural, less robotic
      max_tokens: 800,  // more room for detailed answers
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content ?? "";

    // Robust JSON parsing — try multiple approaches
    let parsed: { text?: string; action?: unknown } = {};
    let parseSuccess = false;

    // Attempt 1: direct parse
    try {
      parsed = JSON.parse(raw);
      parseSuccess = true;
    } catch {
      // Attempt 2: extract JSON from markdown fences or surrounding text
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
          parseSuccess = true;
        } catch {
          // Attempt 3: just use the raw text as the reply
        }
      }
    }

    // Determine the text to speak
    let text = "";
    if (typeof parsed.text === "string" && parsed.text.trim().length > 0) {
      text = parsed.text;
    } else if (!parseSuccess && raw.trim().length > 0) {
      // If we couldn't parse JSON but got plain text, use it directly
      text = raw.replace(/```json|```/g, "").trim();
      // If it still looks like JSON, try to extract just the text value
      try {
        const fallback = JSON.parse(text);
        if (typeof fallback.text === "string") text = fallback.text;
      } catch {
        // use raw text as-is
      }
    }

    // Last resort fallback
    if (!text || text.trim().length === 0) {
      text = "Hmm, I lost my train of thought there. What were you saying?";
    }

    // Determine the action
    let action: AssistantAction | null = null;
    if (parsed.action && typeof parsed.action === "object") {
      action = parsed.action as AssistantAction;
    } else if (!parseSuccess) {
      // Try to infer an action from the text
      action = extractActionFromText(text, plant);
    }

    return NextResponse.json({ text, action });
  } catch (err) {
    console.error("[chat] error", err);
    return NextResponse.json(
      {
        text: "Sorry, my connection hiccuped for a second. What were you asking?",
        action: null,
      },
      { status: 200 }
    );
  }
}

export type { ChatMessage };
