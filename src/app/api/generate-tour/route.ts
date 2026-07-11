import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import { getPlantById } from "@/lib/plant/templates";
import { EQUIPMENT_LIBRARY } from "@/lib/plant/equipmentLibrary";
import type { PlantTemplate } from "@/lib/plant/types";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Generates a podcast-style narration script for a plant tour.
 * Uses the LLM to write a conversational, natural narration with
 * emotion hints for the TTS engine. This is the NotebookLM pattern:
 * the LLM writes the script, then a high-quality TTS renders it.
 *
 * Accepts either a `plantId` (for legacy hardcoded templates) or a full
 * `plant` object (for plants built by the layout engine). The full-plant
 * path is the new default.
 */
export async function POST(req: NextRequest) {
  let body: { plantId?: string; plant?: PlantTemplate };
  try {
    body = (await req.json()) as { plantId?: string; plant?: PlantTemplate };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Prefer the full plant object (new path); fall back to legacy lookup
  let plant: PlantTemplate | undefined = body.plant;
  if (!plant && body.plantId) {
    plant = getPlantById(body.plantId);
  }
  if (!plant) {
    return NextResponse.json({ error: "Plant not provided" }, { status: 400 });
  }

  // Build a rich description of the plant for the LLM
  const equipmentDescriptions = plant.equipment.map((eq) => {
    const meta = EQUIPMENT_LIBRARY[eq.type];
    return `- ${eq.name} (type: ${eq.type}): ${meta.purpose}${eq.context ? ` | In this plant: ${eq.context}` : ""}`;
  }).join("\n");

  const processSteps = plant.processSteps.map((s) =>
    `Step ${s.order}: ${s.title} — ${s.description} (equipment: ${s.equipmentId})`
  ).join("\n");

  const systemPrompt = `You are a podcast writer specializing in chemical engineering education. Write a conversational, engaging narration script for a 3D plant walkthrough — like a podcast host who is also an experienced process engineer.

The narration should:
- Sound like a real person talking, NOT a textbook or lecture
- Use contractions ("I'll", "that's", "you've", "let's")
- Include natural disfluencies ("so...", "now,", "right?", "here's the thing")
- Ask rhetorical questions to engage the listener
- Be enthusiastic but not over-the-top
- Flow naturally from one piece of equipment to the next following the process flow
- Include brief asides and personal-feeling observations
- Be about 3-4 minutes when spoken (roughly 400-600 words total)

Output format: JSON array of segments, each with:
- "text": the narration text for this segment (1-3 sentences)
- "equipmentId": the equipment ID this segment is about (for camera sync)
- "emotion": an emotion hint for TTS ("neutral", "curious", "enthusiastic", "serious", "thoughtful")

The segments should flow as a continuous narration — no headers, no bullet points, just spoken text split into natural segments.`;

  const userPrompt = `Write a narration script for the ${plant.name}.

Plant overview: ${plant.processOverview}

Equipment in this plant:
${equipmentDescriptions}

Process steps:
${processSteps}

Start with a warm welcome, then walk through the plant following the process flow. End with a brief wrap-up that invites the student to explore on their own.`;

  try {
    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 1500,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";

    // Parse the response — might be an array or an object with an array
    let segments: { text: string; equipmentId?: string; emotion?: string }[] = [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        segments = parsed;
      } else if (parsed.segments && Array.isArray(parsed.segments)) {
        segments = parsed.segments;
      } else if (parsed.text) {
        // Single text response — split into segments
        segments = [{ text: parsed.text, emotion: "neutral" }];
      }
    } catch {
      // If JSON parsing fails, treat the raw text as a single segment
      segments = [{ text: raw, emotion: "neutral" }];
    }

    // Filter out empty segments and ensure text exists
    segments = segments.filter((s) => s.text && s.text.trim().length > 0);

    if (segments.length === 0) {
      return NextResponse.json({
        error: "No narration segments generated",
        fallback: true,
      }, { status: 200 });
    }

    return NextResponse.json({
      plantId: plant.id,
      plantName: plant.name,
      segments,
    });
  } catch (err) {
    console.error("[generate-tour] error", err);
    return NextResponse.json({
      error: "Failed to generate tour script",
      fallback: true,
    }, { status: 200 });
  }
}
