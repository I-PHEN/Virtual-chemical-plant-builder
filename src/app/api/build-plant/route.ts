import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import {
  PLANT_KNOWLEDGE_LIBRARY,
  matchKnowledgeTemplate,
} from "@/lib/plant/knowledge";
import { layoutPlant } from "@/lib/plant/layout";
import type { PlantBuilderResult } from "@/lib/plant/types";

export const runtime = "nodejs";
export const maxDuration = 60;

interface BuildRequestBody {
  command: string;
}

/**
 * The AI Plant Builder — three-tier dispatch.
 *
 *   Tier 1: Curated knowledge templates (fast keyword match)
 *     → If the user asks for "ammonia", we have a hand-written, engineering-
 *       verified template ready. Instant.
 *
 *   Tier 2: AI plant composer (no template match → compose one fresh)
 *     → If the user asks for "a coal preparation plant" or "a copper smelter"
 *       (something we don't have a template for), the composer LLM generates
 *       a new PlantKnowledgeTemplate on the fly, constrained to our equipment
 *       library. Validated, then run through the same layout engine.
 *
 *   Tier 3: Graceful fallback
 *     → If the composer fails or the user's request is ambiguous, we explain
 *       what we can do and suggest trying again.
 *
 * The layout engine is the same deterministic code in both Tier 1 and Tier 2.
 * It doesn't care whether the template was hand-written or AI-composed.
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

  // ─── Tier 1: Fast keyword match against curated templates ───
  const localMatch = matchKnowledgeTemplate(command);
  if (localMatch && localMatch.score >= 2) {
    return NextResponse.json(buildResult(localMatch.template, false));
  }

  // ─── Tier 1.5: LLM check — does this clearly match a curated template? ───
  // This catches "build me a haber-bosch plant" which keyword match misses.
  const available = PLANT_KNOWLEDGE_LIBRARY.map(
    (p) =>
      `- id: ${p.id}\n  name: ${p.name}\n  keywords: ${p.keywords.join(", ")}\n  description: ${p.description}`
  ).join("\n");

  const selectorPrompt = `You are the Plant Builder component of an AI Chemical Plant learning platform.
A student has spoken or typed a request. Decide which pre-built plant template best matches their request.

Available templates:
${available}

If the request clearly maps to one of the templates, reply with JSON:
{"plantId": "<id>", "reason": "<one short sentence>"}

If NONE of the templates clearly match (the request is for a different type of plant), reply with:
{"plantId": null, "reason": "compose"}

Reply with JSON only — no markdown, no commentary.`;

  try {
    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "system", content: selectorPrompt },
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
      if (tpl) return NextResponse.json(buildResult(tpl, false));
    }

    // ─── Tier 2: No curated template match → compose one fresh ───
    // Forward to the composer endpoint logic (inlined here to avoid an HTTP hop)
    return await composePlant(command);
  } catch (err) {
    console.error("[build-plant] error", err);
    return NextResponse.json(
      {
        plantId: "",
        plantName: "",
        intro:
          "I had trouble building that plant just now. Try asking for an ammonia plant, or describe a different type of plant and I'll design it for you.",
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
function buildResult(
  template: Parameters<typeof layoutPlant>[0],
  composed: boolean
): PlantBuilderResult {
  const plant = layoutPlant(template);
  const stages = template.stages.map((s) => s.name);
  const equipmentCount = template.stages.reduce(
    (sum, s) => sum + s.equipment.length,
    0
  );
  return {
    plantId: plant.id,
    plantName: plant.name,
    intro: buildIntro(plant.name, template.processOverview, composed),
    plant,
    stages,
    equipmentCount,
  };
}

/**
 * Tier 2: compose a new plant template from scratch using the LLM.
 * Inlined from /api/compose-plant to avoid an internal HTTP round-trip.
 */
async function composePlant(
  command: string
): Promise<NextResponse<PlantBuilderResult>> {
  // Lazy import to keep the module-load cost down for Tier 1 requests
  const { EQUIPMENT_LIBRARY } = await import("@/lib/plant/equipmentLibrary");
  const { AMMONIA_KNOWLEDGE } = await import("@/lib/plant/knowledge/ammonia");
  type EquipmentType = import("@/lib/plant/types").EquipmentType;
  type PlantKnowledgeTemplate = import("@/lib/plant/knowledge/types").PlantKnowledgeTemplate;

  const equipmentCatalog = Object.values(EQUIPMENT_LIBRARY)
    .map((e) => `  - ${e.type}: ${e.singularName} — ${e.tagline}`)
    .join("\n");

  const exampleTemplate: Partial<PlantKnowledgeTemplate> = {
    id: AMMONIA_KNOWLEDGE.id,
    name: AMMONIA_KNOWLEDGE.name,
    tagline: AMMONIA_KNOWLEDGE.tagline,
    description: AMMONIA_KNOWLEDGE.description,
    keywords: AMMONIA_KNOWLEDGE.keywords.slice(0, 4),
    difficulty: AMMONIA_KNOWLEDGE.difficulty,
    estimatedTime: AMMONIA_KNOWLEDGE.estimatedTime,
    stages: AMMONIA_KNOWLEDGE.stages.slice(0, 3).map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      areaKind: s.areaKind,
      equipment: s.equipment.slice(0, 2).map((e) => ({
        id: e.id,
        type: e.type,
        name: e.name,
        tag: e.tag,
        role: e.role,
        sizeClass: e.sizeClass,
        essential: e.essential,
      })),
    })),
    flows: AMMONIA_KNOWLEDGE.flows.slice(0, 5),
    processOverview: AMMONIA_KNOWLEDGE.processOverview.slice(0, 300) + "...",
    chemicalEquation: AMMONIA_KNOWLEDGE.chemicalEquation,
    capacity: AMMONIA_KNOWLEDGE.capacity,
  };

  const systemPrompt = `You are an expert chemical/process engineer who designs plant templates for an educational 3D simulation.

A student has requested a plant type. Compose a complete PlantKnowledgeTemplate as JSON.

RULES:
1. You can ONLY use equipment types from this catalog. Each equipment entry's "type" field MUST be one of these exact strings:
${equipmentCatalog}

2. Output MUST be valid JSON matching this exact shape:
{
  "id": "short_snake_case_id",
  "name": "Human-readable Plant Name",
  "tagline": "One-line description with key chemistry or process",
  "description": "2-3 sentence overview",
  "keywords": ["keyword1", "keyword2"],
  "difficulty": "Beginner" | "Intermediate" | "Advanced",
  "estimatedTime": 15,
  "stages": [
    {
      "id": "stage_id",
      "name": "Stage Display Name",
      "description": "What happens in this stage",
      "areaKind": "process" | "storage" | "utility" | "flare",
      "equipment": [
        { "id": "unique_equipment_id", "type": "<catalog type>", "name": "Display Name", "tag": "X-101", "role": "one sentence", "sizeClass": "small|medium|large|huge", "essential": true }
      ]
    }
  ],
  "flows": [
    { "from": "equipment_id", "to": "equipment_id", "material": "substance_name", "stream": "feed|product|intermediate|utility-hot|utility-cold", "primary": true }
  ],
  "processOverview": "One paragraph technical overview",
  "chemicalEquation": "optional chemistry equation",
  "capacity": "optional real-world capacity range"
}

3. GUIDELINES:
   - 4-8 process stages, ordered by material flow from raw feed to final product
   - 12-30 equipment pieces total (realistic)
   - At least one utility stage (cooling tower, boiler, flare stack, water treatment)
   - Storage stages: areaKind "storage"
   - Every flow's from/to must reference an equipment id that exists in some stage
   - sizeClass: pumps/valves/filters=small, vessels/exchangers=medium, reactors/columns=large, reformers/cooling towers/flare stacks=huge
   - Make the process technically correct for the plant type

4. EXAMPLE (ammonia, abbreviated):
${JSON.stringify(exampleTemplate, null, 2)}

Output ONLY the JSON. No markdown fences, no commentary.`;

  try {
    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Compose a plant template for: "${command}"` },
      ],
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    let template: PlantKnowledgeTemplate;
    try {
      template = JSON.parse(raw) as PlantKnowledgeTemplate;
    } catch {
      return NextResponse.json({
        plantId: "",
        plantName: "",
        intro:
          "I had trouble designing that plant. Could you describe it differently, or try a different type of plant?",
      } satisfies PlantBuilderResult);
    }

    // Validate
    const validTypes = new Set(Object.keys(EQUIPMENT_LIBRARY));
    const allIds = new Set<string>();
    for (const stage of template.stages ?? []) {
      for (const eq of stage.equipment ?? []) {
        if (!eq.id || !eq.type || !validTypes.has(eq.type as EquipmentType)) {
          return NextResponse.json({
            plantId: "",
            plantName: "",
            intro:
              "I tried to design that plant but the result wasn't quite right. Could you be more specific about what the plant should do?",
          } satisfies PlantBuilderResult);
        }
        allIds.add(eq.id);
      }
    }
    for (const flow of template.flows ?? []) {
      if (!allIds.has(flow.from) || !allIds.has(flow.to)) {
        return NextResponse.json({
          plantId: "",
          plantName: "",
          intro:
            "I tried to design that plant but the process flow didn't connect properly. Could you describe the main steps the plant should perform?",
          } satisfies PlantBuilderResult);
      }
    }

    // Sanitize
    const cleanId =
      (template.id || command)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .slice(0, 40) || "custom_plant";
    const sanitized: PlantKnowledgeTemplate = {
      ...template,
      id: cleanId,
      name: template.name || "Custom Plant",
      tagline: template.tagline || "AI-composed plant",
      description: template.description || "",
      keywords: template.keywords || [],
      difficulty: template.difficulty || "Intermediate",
      estimatedTime: template.estimatedTime || 15,
      stages: (template.stages || []).map((s) => ({
        ...s,
        areaKind: s.areaKind || "process",
        equipment: (s.equipment || []).map((e) => ({
          ...e,
          sizeClass: e.sizeClass || "medium",
          essential: e.essential ?? true,
        })),
      })),
      flows: (template.flows || []).map((f) => ({
        ...f,
        stream: f.stream || "intermediate",
        primary: f.primary ?? true,
      })),
      processOverview: template.processOverview || template.description || "",
      theme: template.theme || {
        equipmentColor: "#94a3b8",
        structureColor: "#475569",
        accent: "#22d3ee",
        mood: "industrial-grey",
        backdrop: "cooling-towers",
      },
    };

    // Layout
    const plant = layoutPlant(sanitized);
    return NextResponse.json({
      plantId: plant.id,
      plantName: plant.name,
      intro: buildIntro(plant.name, sanitized.processOverview, true),
      plant,
      stages: sanitized.stages.map((s) => s.name),
      equipmentCount: sanitized.stages.reduce(
        (sum, s) => sum + s.equipment.length,
        0
      ),
    } satisfies PlantBuilderResult);
  } catch (err) {
    console.error("[build-plant] compose failed", err);
    return NextResponse.json({
      plantId: "",
      plantName: "",
      intro:
        "I had trouble designing that plant just now. Try asking for an ammonia plant, or describe a different type of plant.",
    } satisfies PlantBuilderResult);
  }
}

function buildIntro(name: string, _overview: string, composed: boolean): string {
  const shortName = name.split(" (")[0];
  if (composed) {
    const variants = [
      `Here's your ${shortName} — I designed this one fresh for you. I'm your process engineer, and I'll walk you through how it all fits together. Want the full tour, or would you rather poke around on your own first?`,
      `Alright, I've put together a ${shortName} for you. Every piece here has a job, and I know them all. Click anything that catches your eye, or tell me to walk you through it from the start. What sounds good?`,
      `Done — your ${shortName} is ready. I designed this from scratch based on what you asked for, so feel free to ask me why any piece is where it is. Should we start the tour?`,
    ];
    return variants[Math.floor(Math.random() * variants.length)];
  }
  const variants = [
    `Hey! Welcome to the ${shortName}. I'm your process engineer — think of me as someone who's been working here for years and actually loves showing people around. We can walk through the whole thing together, or you can just click on anything that catches your eye and ask me about it. What sounds good?`,
    `Alright, the ${shortName} is ready! I'll be your guide through this thing. I know every pipe and valve in here, so don't be shy — ask me anything. Want me to start from the beginning and walk you through it?`,
    `Here we go — the ${shortName}, all built and ready to explore. I'm basically your personal engineer for this plant. Click anything you're curious about, or just tell me to walk you through it and I'll take it from the top. What do you want to see first?`,
  ];
  return variants[Math.floor(Math.random() * variants.length)];
}
