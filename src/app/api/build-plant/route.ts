import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import {
  PLANT_KNOWLEDGE_LIBRARY,
  matchKnowledgeTemplate,
} from "@/lib/plant/knowledge";
import { layoutPlant } from "@/lib/plant/layout";
import type { PlantBuilderResult } from "@/lib/plant/types";

export const runtime = "nodejs";
export const maxDuration = 30;

interface BuildRequestBody {
  command: string;
}

/**
 * The AI Plant Builder.
 *
 * Layered matching strategy:
 *   1. Fast path: deterministic keyword match against knowledge templates.
 *   2. Slow path: LLM picks the closest template.
 *
 * Once a template is chosen, the layout engine computes the full plant layout
 * deterministically. The AI's job is selection; the layout engine's job is
 * spatial arrangement. They never overlap.
 */
export async function POST(req: NextRequest) {
  let body: BuildRequestBody;
  try {
    body = (await req.json()) as BuildRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const command = (body.command ?? "").trim();
  if (!command) {
    return NextResponse.json({ error: "Empty command" }, { status: 400 });
  }

  // Fast path: keyword match
  const localMatch = matchKnowledgeTemplate(command);
  if (localMatch && localMatch.score >= 2) {
    return NextResponse.json(buildResult(localMatch.template));
  }

  // Slow path: ask the LLM to choose
  const available = PLANT_KNOWLEDGE_LIBRARY.map(
    (p) =>
      `- id: ${p.id}\n  name: ${p.name}\n  keywords: ${p.keywords.join(", ")}\n  description: ${p.description}`
  ).join("\n");

  const systemPrompt = `You are the Plant Builder component of an AI Chemical Plant learning platform.
A student has spoken or typed a request. Decide which pre-built plant template best matches their request.

Available templates:
${available}

If the request clearly maps to one of the templates, reply with JSON:
{"plantId": "<id>", "reason": "<one short sentence>"}

If NONE of the templates match, reply with JSON:
{"plantId": null, "reason": "<one short sentence apologising and listing the available plants by name>"}

Reply with JSON only — no markdown, no commentary.`;

  try {
    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: command },
      ],
      temperature: 0.2,
      max_tokens: 200,
      response_format: { type: "json_object" },
    });
    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as { plantId: string | null; reason?: string };

    if (parsed.plantId) {
      const tpl = PLANT_KNOWLEDGE_LIBRARY.find((p) => p.id === parsed.plantId);
      if (tpl) return NextResponse.json(buildResult(tpl));
    }

    // No match
    return NextResponse.json({
      plantId: "",
      plantName: "",
      intro:
        parsed.reason ??
        "I don't have that plant yet. Try asking for an ammonia plant — more are on the way.",
    } satisfies PlantBuilderResult);
  } catch (err) {
    console.error("[build-plant] error", err);
    return NextResponse.json(
      {
        plantId: "",
        plantName: "",
        intro:
          "I had trouble building that plant just now. Try asking for an ammonia plant.",
      } satisfies PlantBuilderResult,
      { status: 200 }
    );
  }
}

/**
 * Build the full PlantBuilderResult from a chosen knowledge template.
 * The layout engine runs here (server-side) so the client receives a fully
 * placed plant ready to render.
 */
function buildResult(template: Parameters<typeof layoutPlant>[0]): PlantBuilderResult {
  const plant = layoutPlant(template);
  const stages = template.stages.map((s) => s.name);
  const equipmentCount = template.stages.reduce(
    (sum, s) => sum + s.equipment.length,
    0
  );
  return {
    plantId: plant.id,
    plantName: plant.name,
    intro: buildIntro(plant.name, template.processOverview),
    plant,
    stages,
    equipmentCount,
  };
}

function buildIntro(name: string, _overview: string): string {
  const shortName = name.split(" (")[0];
  const variants = [
    `Hey! Welcome to the ${shortName}. I'm your process engineer — think of me as someone who's been working here for years and actually loves showing people around. We can walk through the whole thing together, or you can just click on anything that catches your eye and ask me about it. What sounds good?`,
    `Alright, the ${shortName} is ready! I'll be your guide through this thing. I know every pipe and valve in here, so don't be shy — ask me anything. Want me to start from the beginning and walk you through it?`,
    `Here we go — the ${shortName}, all built and ready to explore. I'm basically your personal engineer for this plant. Click anything you're curious about, or just tell me to walk you through it and I'll take it from the top. What do you want to see first?`,
  ];
  return variants[Math.floor(Math.random() * variants.length)];
}
