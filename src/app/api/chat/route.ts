import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import { getPlantById } from "@/lib/plant/templates";
import { buildSystemPrompt } from "@/lib/ai/systemPrompt";
import { EQUIPMENT_LIBRARY } from "@/lib/plant/equipmentLibrary";
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

function getRelevantEquipmentMetadata(message: string, plant: PlantTemplate | null) {
  if (!plant) return [];
  const lower = message.toLowerCase();
  const relevant = [];
  for (const eq of plant.equipment) {
    const meta = EQUIPMENT_LIBRARY[eq.type];
    const eqName = eq.name.toLowerCase();
    const eqType = eq.type.toLowerCase();
    const singularName = meta.singularName.toLowerCase();
    if (
      lower.includes(eqName) ||
      lower.includes(eqType) ||
      lower.includes(singularName) ||
      (lower.includes("this") && plant.equipment.find(e => e.id === eq.id))
    ) {
      relevant.push({ equipment: eq, meta });
    }
  }
  return relevant;
}

function extractActionFromText(text: string, plant: PlantTemplate | null): AssistantAction | null {
  if (!plant) return null;
  const lower = text.toLowerCase();
  for (const eq of plant.equipment) {
    const eqName = eq.name.toLowerCase();
    const eqType = eq.type.toLowerCase();
    if (lower.includes(eqName) || lower.includes(eqType)) {
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
  const relevantEquipment = getRelevantEquipmentMetadata(body.message, plant);

  const systemPrompt = buildSystemPrompt({
    plant,
    selectedEquipment,
    tourStep: body.tourStep ?? null,
    relevantEquipment,
  });

  const conversation: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: systemPrompt },
  ];

  for (const m of body.history.slice(-16)) {
    conversation.push({ role: m.role, content: m.content });
  }
  conversation.push({ role: "user", content: body.message });

  try {
    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: conversation,
      temperature: 0.85,
      max_tokens: 800,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content ?? "";

    let parsed: { text?: string; action?: unknown } = {};
    let parseSuccess = false;

    try {
      parsed = JSON.parse(raw);
      parseSuccess = true;
    } catch {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
          parseSuccess = true;
        } catch {
          // ignore
        }
      }
    }

    let text = "";
    if (typeof parsed.text === "string" && parsed.text.trim().length > 0) {
      text = parsed.text;
    } else if (!parseSuccess && raw.trim().length > 0) {
      text = raw.replace(/```json|```/g, "").trim();
      try {
        const fallback = JSON.parse(text);
        if (typeof fallback.text === "string") text = fallback.text;
      } catch {
        // use raw text as-is
      }
    }

    if (!text || text.trim().length === 0) {
      text = "Hmm, I lost my train of thought there. What were you saying?";
    }

    let action: AssistantAction | null = null;
    if (parsed.action && typeof parsed.action === "object") {
      action = parsed.action as AssistantAction;
    } else if (!parseSuccess) {
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
