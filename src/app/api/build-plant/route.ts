import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import { PLANT_TEMPLATES, findPlantByCommand } from "@/lib/plant/templates";
import type { PlantBuilderResult } from "@/lib/plant/types";

export const runtime = "nodejs";
export const maxDuration = 30;

interface BuildRequestBody {
  command: string;
}

/**
 * The AI Plant Builder interprets the student's spoken command and matches
 * it to one of the pre-built plant templates. We first try a deterministic
 * keyword match for speed; if that fails we ask the LLM to pick the closest
 * template, or to politely report that no template is available yet.
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

  // Fast path: deterministic keyword match
  const localMatch = findPlantByCommand(command);
  if (localMatch && localMatch.score >= 2) {
    return NextResponse.json({
      plantId: localMatch.template.id,
      plantName: localMatch.template.name,
      intro: buildIntro(localMatch.template.name, localMatch.template.processOverview),
    } satisfies PlantBuilderResult);
  }

  // Slow path: ask the LLM to choose
  const available = PLANT_TEMPLATES.map(
    (p) => `- id: ${p.id}\n  name: ${p.name}\n  keywords: ${p.keywords.join(", ")}\n  description: ${p.description}`
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

    if (parsed.plantId && PLANT_TEMPLATES.some((p) => p.id === parsed.plantId)) {
      const tpl = PLANT_TEMPLATES.find((p) => p.id === parsed.plantId)!;
      return NextResponse.json({
        plantId: tpl.id,
        plantName: tpl.name,
        intro: buildIntro(tpl.name, tpl.processOverview),
      } satisfies PlantBuilderResult);
    }

    // No match
    return NextResponse.json({
      plantId: "",
      plantName: "",
      intro:
        parsed.reason ??
        "I don't have that plant yet. Try asking for an ammonia plant, a distillation plant, a sulfuric acid plant, or an ethanol plant.",
    } satisfies PlantBuilderResult);
  } catch (err) {
    console.error("[build-plant] error", err);
    return NextResponse.json(
      {
        plantId: "",
        plantName: "",
        intro:
          "I had trouble building that plant just now. Try asking for an ammonia plant, a distillation plant, a sulfuric acid plant, or an ethanol plant.",
      } satisfies PlantBuilderResult,
      { status: 200 }
    );
  }
}

function buildIntro(name: string, overview: string): string {
  const shortName = name.split(" (")[0];
  const variants = [
    `Hey! Welcome to the ${shortName}. I'm your process engineer — think of me as someone who's been working here for years and actually loves showing people around. We can walk through the whole thing together, or you can just click on anything that catches your eye and ask me about it. What sounds good?`,
    `Alright, the ${shortName} is ready! I'll be your guide through this thing. I know every pipe and valve in here, so don't be shy — ask me anything. Want me to start from the beginning and walk you through it?`,
    `Here we go — the ${shortName}, all built and ready to explore. I'm basically your personal engineer for this plant. Click anything you're curious about, or just tell me to walk you through it and I'll take it from the top. What do you want to see first?`,
  ];
  return variants[Math.floor(Math.random() * variants.length)];
}
