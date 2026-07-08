import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import { getPlantById } from "@/lib/plant/templates";
import { buildSystemPrompt } from "@/lib/ai/systemPrompt";
import type { ChatMessage, EquipmentInstance, PlantTemplate } from "@/lib/plant/types";

export const runtime = "nodejs";
export const maxDuration = 30;

interface ChatRequestBody {
  plantId: string | null;
  selectedEquipmentId: string | null;
  tourStep: number | null;
  history: { role: "user" | "assistant"; content: string }[];
  message: string;
}

// We can't access the Zustand store on the server (it's client-only), so we
// reconstruct the plant context from the plantId and selectedEquipmentId.
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

  // Build messages array for the model
  const conversation: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: systemPrompt },
  ];

  for (const m of body.history.slice(-10)) {
    conversation.push({ role: m.role, content: m.content });
  }
  conversation.push({ role: "user", content: body.message });

  try {
    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: conversation,
      temperature: 0.6,
      max_tokens: 600,
      // Ask the model to reply in JSON
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    let parsed: { text?: string; action?: unknown } = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      // If the model didn't produce clean JSON, treat the raw text as the reply.
      parsed = { text: raw };
    }

    const text =
      typeof parsed.text === "string" && parsed.text.trim().length > 0
        ? parsed.text
        : "I'm not sure how to answer that — could you rephrase?";

    return NextResponse.json({
      text,
      action: parsed.action ?? null,
    });
  } catch (err) {
    console.error("[chat] error", err);
    return NextResponse.json(
      {
        text: "Sorry, I had trouble reaching the AI just now. Please try again.",
        action: null,
        error: String(err),
      },
      { status: 200 }
    );
  }
}

// Helper kept for type-only export parity (avoids unused import lint).
export type { ChatMessage };
