import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import { layoutPlant } from "@/lib/plant/layout";
import { AMMONIA_KNOWLEDGE } from "@/lib/plant/knowledge/ammonia";
import { EQUIPMENT_LIBRARY } from "@/lib/plant/equipmentLibrary";
import type { EquipmentType, PlantBuilderResult } from "@/lib/plant/types";
import type { PlantKnowledgeTemplate } from "@/lib/plant/knowledge/types";

export const runtime = "nodejs";
export const maxDuration = 60;

interface ComposeRequestBody {
  command: string;
}

/**
 * AI Plant Composer — Tier 2 of the plant architecture.
 *
 * When the user asks for a plant we don't have a curated knowledge template
 * for (e.g. "build a coal preparation plant", "build a copper smelter",
 * "build a pasta factory"), the composer asks the LLM to compose a NEW
 * PlantKnowledgeTemplate on the fly.
 *
 * Constraints that keep the output sane:
 *   1. The LLM can ONLY use equipment types from our library (no inventing
 *      a "flux capacitor" — if it's not in EQUIPMENT_LIBRARY, it can't be used)
 *   2. The output must match the PlantKnowledgeTemplate JSON schema exactly
 *   3. The ammonia template is given as a few-shot example so the LLM sees
 *      what a good template looks like
 *   4. We validate the output: every flow endpoint must reference an equipment
 *      id that exists in some stage
 *
 * Once validated, the template goes straight to layoutPlant() — the same
 * deterministic engine that places curated templates. The layout engine
 * doesn't care whether the template was hand-written or AI-composed.
 */
export async function POST(req: NextRequest) {
  let body: ComposeRequestBody;
  try {
    body = (await req.json()) as ComposeRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const command = (body.command ?? "").trim();
  if (!command) {
    return NextResponse.json({ error: "Empty command" }, { status: 400 });
  }

  // Build the equipment catalog the LLM can choose from
  const equipmentCatalog = Object.values(EQUIPMENT_LIBRARY)
    .map((e) => `  - ${e.type}: ${e.singularName} — ${e.tagline}`)
    .join("\n");

  // Few-shot example: a stripped-down ammonia template so the LLM sees the shape
  const exampleTemplate = buildExampleTemplate();

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
        {
          "id": "unique_equipment_id",
          "type": "<one of the catalog types above>",
          "name": "Equipment Display Name",
          "tag": "X-101",
          "role": "What this piece does in one sentence",
          "sizeClass": "small" | "medium" | "large" | "huge",
          "essential": true
        }
      ]
    }
  ],
  "flows": [
    { "from": "equipment_id", "to": "equipment_id", "material": "substance_name", "stream": "feed" | "product" | "intermediate" | "utility-hot" | "utility-cold", "primary": true }
  ],
  "processOverview": "One paragraph technical overview",
  "chemicalEquation": "optional chemistry equation",
  "capacity": "optional real-world capacity range"
}

3. GUIDELINES:
   - Include 4-8 process stages, ordered by material flow from raw feed to final product
   - Total equipment count: 12-30 pieces (realistic for a real plant)
   - Include at least one utility stage (cooling tower, boiler, flare stack, etc.)
   - Storage stages should have areaKind "storage" and be bunded
   - Every flow's "from" and "to" must reference an equipment id that exists in some stage
   - Size class: pumps/valves/filters = small, vessels/heat exchangers = medium, reactors/columns = large, reformers/cooling towers/flare stacks = huge
   - Make the process flow technically correct for the plant type
   - If the plant doesn't exist in real life or you're unsure, still produce your best effort — the simulation will render whatever you produce

4. EXAMPLE (ammonia plant, abbreviated):
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
      return NextResponse.json(
        {
          plantId: "",
          plantName: "",
          intro:
            "I had trouble designing that plant. Could you describe it differently, or try a different type of plant?",
        } satisfies PlantBuilderResult,
        { status: 200 }
      );
    }

    // Validate the composed template
    const validation = validateTemplate(template);
    if (!validation.ok) {
      console.error("[compose-plant] validation failed:", validation.error);
      return NextResponse.json(
        {
          plantId: "",
          plantName: "",
          intro: `I tried to design that plant but the result wasn't quite right (${validation.error}). Could you be more specific about what the plant should do?`,
        } satisfies PlantBuilderResult,
        { status: 200 }
      );
    }

    // Sanitize: assign defaults for any missing optional fields
    const sanitized = sanitizeTemplate(template, command);

    // Run the layout engine — same deterministic code path as curated templates
    const plant = layoutPlant(sanitized);
    const stages = sanitized.stages.map((s) => s.name);
    const equipmentCount = sanitized.stages.reduce(
      (sum, s) => sum + s.equipment.length,
      0
    );

    return NextResponse.json({
      plantId: plant.id,
      plantName: plant.name,
      intro: buildIntro(plant.name, sanitized.processOverview),
      plant,
      stages,
      equipmentCount,
      composed: true,
    });
  } catch (err) {
    console.error("[compose-plant] error", err);
    return NextResponse.json(
      {
        plantId: "",
        plantName: "",
        intro:
          "I had trouble reaching my design tools just now. Try again in a moment?",
      } satisfies PlantBuilderResult,
      { status: 200 }
    );
  }
}

/**
 * Validate that the composed template is well-formed enough to render.
 * We don't check engineering correctness — just structural integrity.
 */
function validateTemplate(
  t: PlantKnowledgeTemplate
): { ok: true } | { ok: false; error: string } {
  if (!t.id || !t.name || !t.stages || !Array.isArray(t.stages)) {
    return { ok: false, error: "missing required top-level fields" };
  }
  if (t.stages.length === 0) {
    return { ok: false, error: "no stages defined" };
  }
  const validTypes = new Set(Object.keys(EQUIPMENT_LIBRARY));
  const allEquipmentIds = new Set<string>();
  for (const stage of t.stages) {
    if (!stage.id || !stage.equipment || !Array.isArray(stage.equipment)) {
      return { ok: false, error: `stage ${stage.id ?? "(unnamed)"} malformed` };
    }
    for (const eq of stage.equipment) {
      if (!eq.id || !eq.type) {
        return {
          ok: false,
          error: `equipment missing id or type in stage ${stage.id}`,
        };
      }
      if (!validTypes.has(eq.type as EquipmentType)) {
        return {
          ok: false,
          error: `equipment ${eq.id} has unknown type "${eq.type}"`,
        };
      }
      if (allEquipmentIds.has(eq.id)) {
        return { ok: false, error: `duplicate equipment id "${eq.id}"` };
      }
      allEquipmentIds.add(eq.id);
    }
  }
  if (t.flows && Array.isArray(t.flows)) {
    for (const flow of t.flows) {
      if (!allEquipmentIds.has(flow.from)) {
        return {
          ok: false,
          error: `flow "from" references unknown equipment "${flow.from}"`,
        };
      }
      if (!allEquipmentIds.has(flow.to)) {
        return {
          ok: false,
          error: `flow "to" references unknown equipment "${flow.to}"`,
        };
      }
    }
  }
  return { ok: true };
}

/** Sanitize and fill in defaults so the template is render-ready. */
function sanitizeTemplate(
  t: PlantKnowledgeTemplate,
  command: string
): PlantKnowledgeTemplate {
  const cleanId =
    (t.id || command)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 40) || "custom_plant";

  return {
    ...t,
    id: cleanId,
    name: t.name || "Custom Plant",
    tagline: t.tagline || "AI-composed plant",
    description: t.description || "",
    keywords: t.keywords || [],
    difficulty: t.difficulty || "Intermediate",
    estimatedTime: t.estimatedTime || 15,
    stages: t.stages.map((s) => ({
      ...s,
      areaKind: s.areaKind || "process",
      equipment: s.equipment.map((e) => ({
        ...e,
        sizeClass: e.sizeClass || "medium",
        essential: e.essential ?? true,
      })),
    })),
    flows: (t.flows || []).map((f) => ({
      ...f,
      stream: f.stream || "intermediate",
      primary: f.primary ?? true,
    })),
    processOverview: t.processOverview || t.description || "",
    theme: t.theme || {
      equipmentColor: "#94a3b8",
      structureColor: "#475569",
      accent: "#22d3ee",
      mood: "industrial-grey",
      backdrop: "cooling-towers",
    },
  };
}

/** Build a stripped-down ammonia template as a few-shot example. */
function buildExampleTemplate(): Partial<PlantKnowledgeTemplate> {
  const a = AMMONIA_KNOWLEDGE;
  return {
    id: a.id,
    name: a.name,
    tagline: a.tagline,
    description: a.description,
    keywords: a.keywords.slice(0, 4),
    difficulty: a.difficulty,
    estimatedTime: a.estimatedTime,
    stages: a.stages.slice(0, 3).map((s) => ({
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
    flows: a.flows.slice(0, 5),
    processOverview: a.processOverview.slice(0, 300) + "...",
    chemicalEquation: a.chemicalEquation,
    capacity: a.capacity,
  };
}

function buildIntro(name: string, _overview: string): string {
  const shortName = name.split(" (")[0];
  const variants = [
    `Here's your ${shortName} — I designed this one fresh for you. I'm your process engineer, and I'll walk you through how it all fits together. Want the full tour, or would you rather poke around on your own first?`,
    `Alright, I've put together a ${shortName} for you. Every piece here has a job, and I know them all. Click anything that catches your eye, or tell me to walk you through it from the start. What sounds good?`,
    `Done — your ${shortName} is ready. I designed this from scratch based on what you asked for, so feel free to ask me why any piece is where it is. Should we start the tour?`,
  ];
  return variants[Math.floor(Math.random() * variants.length)];
}
