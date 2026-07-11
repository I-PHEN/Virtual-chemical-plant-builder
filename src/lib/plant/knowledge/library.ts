import type { PlantKnowledgeTemplate } from "./types";
import { AMMONIA_KNOWLEDGE } from "./ammonia";

/**
 * The library of plant knowledge templates — the AI's textbook.
 *
 * Adding a new plant family = writing one PlantKnowledgeTemplate and
 * appending it here. Nothing else in the system changes.
 *
 * The layout engine, the build-plant API, and the narration generator
 * all read from this index.
 */
export const PLANT_KNOWLEDGE_LIBRARY: PlantKnowledgeTemplate[] = [
  AMMONIA_KNOWLEDGE,
  // DISTILLATION_KNOWLEDGE,
  // SULFURIC_ACID_KNOWLEDGE,
  // ETHANOL_KNOWLEDGE,
];

/** Find a knowledge template by id. */
export function getKnowledgeTemplate(
  id: string
): PlantKnowledgeTemplate | undefined {
  return PLANT_KNOWLEDGE_LIBRARY.find((p) => p.id === id);
}

/**
 * Best-effort keyword match against knowledge templates.
 * Used by the build-plant API as a fast path before the LLM is called.
 */
export function matchKnowledgeTemplate(
  command: string
): { template: PlantKnowledgeTemplate; score: number } | null {
  const text = command.toLowerCase();
  let best: { template: PlantKnowledgeTemplate; score: number } | null = null;
  for (const template of PLANT_KNOWLEDGE_LIBRARY) {
    let score = 0;
    for (const kw of template.keywords) {
      if (text.includes(kw)) score += kw.length > 4 ? 2 : 1;
    }
    if (text.includes(template.name.toLowerCase().split(" ")[0])) score += 3;
    if (score > 0 && (!best || score > best.score)) best = { template, score };
  }
  return best;
}
