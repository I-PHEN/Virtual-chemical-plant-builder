/**
 * Plant Knowledge Template — the engineering truth of a plant family.
 *
 * This is the "textbook" the AI reasons from. NO COORDINATES, NO LAYOUT.
 * Just: what stages exist, what equipment belongs in each, how they connect,
 * and what the process actually does.
 *
 * The layout engine takes this and computes all (x, y, z) deterministically.
 * The AI takes this and decides which pieces to include, what to call them,
 * and how to narrate them.
 *
 * Adding a new plant family = writing one of these. That's it.
 */

import type { EquipmentType } from "../types";

/**
 * A piece of equipment in a knowledge template. No coordinates — just what it
 * is, what it does, and where in the process flow it sits.
 */
export interface KnowledgeEquipment {
  /** Stable id within the template, e.g. "primary_reformer". */
  id: string;
  /** What kind of equipment this is — drives the 3D model lookup. */
  type: EquipmentType;
  /** Human-readable name, e.g. "Primary Reformer". */
  name: string;
  /** Engineering tag for the process flow diagram, e.g. "R-101". */
  tag?: string;
  /** What this piece does in one sentence. */
  role: string;
  /**
   * Size class — small/medium/large/huge. The layout engine uses this to
   * assign footprint when no GLB manifest is available.
   */
  sizeClass: "small" | "medium" | "large" | "huge";
  /**
   * Whether this is essential to the plant or optional. The AI can drop
   * "optional" pieces if the user asks for a simplified view.
   */
  essential: boolean;
  /** Tags passed to the asset registry for GLB model selection. */
  assetTags?: string[];
  /** Optional override of the equipment's standard context. */
  contextOverride?: string;
}

/**
 * A process stage = one process area on the plot plan.
 * Stages are ordered; flow goes from stage 0 → stage N.
 */
export interface KnowledgeStage {
  /** Stable id, e.g. "reforming". */
  id: string;
  /** Display name, e.g. "Reforming Section". */
  name: string;
  /** One-line description of what happens here. */
  description: string;
  /** The equipment that lives in this stage. */
  equipment: KnowledgeEquipment[];
  /** Whether this is utility/storage (laid out on the back row) or process. */
  areaKind: "process" | "storage" | "utility" | "flare";
  /** Whether the area should be bunded (spill containment). */
  bunded?: boolean;
}

/**
 * A flow connection between two pieces of equipment.
 * The layout engine uses these to know which pipes to draw.
 */
export interface KnowledgeFlow {
  /** From equipment id (must exist in some stage). */
  from: string;
  /** To equipment id. */
  to: string;
  /** What's flowing — drives pipe color and narration. */
  material: string;
  /** Stream classification for visual styling. */
  stream: "feed" | "product" | "intermediate" | "utility-hot" | "utility-cold";
  /** Whether this is a primary process flow or a utility/side connection. */
  primary: boolean;
}

/**
 * The full knowledge template. This is what the AI plant builder consumes.
 */
export interface PlantKnowledgeTemplate {
  /** Stable id, e.g. "ammonia". */
  id: string;
  /** Display name, e.g. "Ammonia Plant (Haber–Bosch)". */
  name: string;
  /** Short headline shown on welcome screen. */
  tagline: string;
  /** One-paragraph description. */
  description: string;
  /** Keywords for command matching. */
  keywords: string[];
  /** Difficulty for landing screen. */
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  /** Estimated tour time in minutes. */
  estimatedTime: number;

  /** The ordered stages of the process. */
  stages: KnowledgeStage[];

  /** Connections between equipment across stages. */
  flows: KnowledgeFlow[];

  /** One-paragraph technical overview the AI uses for narration grounding. */
  processOverview: string;

  /** The main chemical equation, for display. */
  chemicalEquation?: string;

  /** Real-world output capacity range (e.g. "1000–2000 t/d"). */
  capacity?: string;

  /** Visual theme — colors, mood, backdrop. */
  theme?: {
    equipmentColor: string;
    structureColor: string;
    accent: string;
    mood: "industrial-grey" | "warm-rust" | "clean-refinery" | "fermentation-green";
    backdrop: "cooling-towers" | "acid-basins" | "refinery-towers" | "fermentation-tanks";
  };
}
