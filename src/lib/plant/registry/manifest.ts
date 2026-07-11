/**
 * AssetManifest — the machine-readable contract that ships with every GLB.
 *
 * The registry never browses file names. It queries manifests. An asset without
 * a manifest is invisible to the system. This is what lets the library scale
 * from 6 models to 6,000 without any code change — the AI and layout engine
 * only ever talk to the registry, and the registry only ever reasons about
 * these fields.
 *
 * Manifests live as JSON files in /public/assets/registry/*.json and are
 * loaded at startup by the registry module.
 */

import type { EquipmentType } from "../types";

/** Quality tier drives render priority and LOD distance. */
export type QualityTier = "hero" | "standard" | "background";

/**
 * A point on the model where a pipe can connect. Layout engine uses these
 * to snap pipes to actual nozzles instead of bounding-box centers, which is
 * what separates an "engineered" plant from a "stack of shapes" plant.
 */
export interface ConnectionPoint {
  /** Stable identifier, e.g. "inlet_top", "outlet_side" */
  name: string;
  /** Position in model-local meters, relative to model origin */
  position: [number, number, number];
  /** Direction the pipe emerges from this point, in model-local space */
  direction: [number, number, number];
  role: "inlet" | "outlet" | "vent" | "drain" | "instrument" | "utility";
  /** Phase of the material at this connection — affects pipe color/style */
  material?: "gas" | "liquid" | "two-phase" | "steam" | "condensate" | "electrical";
}

/**
 * 3D bounding box in meters. Used by the layout engine for collision
 * avoidance and aisle-width calculation. The model itself can be any
 * shape — what matters is the footprint it occupies on the plot.
 */
export interface Footprint {
  /** Width along the model's local X axis (meters) */
  w: number;
  /** Depth along the model's local Z axis (meters) */
  d: number;
  /** Height along the model's local Y axis (meters) */
  h: number;
}

/**
 * The full manifest schema. Every field is intentionally required or optional
 * for a specific reason — see inline comments.
 */
export interface AssetManifest {
  /** Stable unique id, e.g. "vertical_reactor_v1". Never changes once published. */
  id: string;

  /** Path to the GLB file, served from /public. Always starts with "/assets/". */
  glbPath: string;

  /**
   * Equipment types this model can play. A vertical vessel might be both
   * "reactor" and "separator" depending on context — the AI decides which
   * role it's playing in a given plant, then the registry returns candidates.
   */
  equipmentTypes: EquipmentType[];

  /** One-sentence description of what this model represents, in engineering terms. */
  primaryFunction: string;

  /** Bounding box for layout collision (meters). */
  footprint: Footprint;

  /** Where pipes connect. Models without connection points fall back to bounding-box edges. */
  connectionPoints: ConnectionPoint[];

  /** Uniform scale applied to the loaded GLB. 1 = use as-is. */
  scale: number;

  /** Y-axis rotation in radians to align the model with the +X or +Z flow direction. */
  rotationY?: number;

  /** Free-form tags for semantic search and filtering, e.g. ["ammonia", "high-pressure"]. */
  tags: string[];

  /** Render priority — hero models are always loaded, background only when close. */
  qualityTier: QualityTier;

  /** Optional path to a low-LOD GLB for distant rendering. */
  lodPath?: string;

  /** Provenance for attribution and license compliance. */
  source: string;
  license: string;
}

/**
 * Query shape — what the layout engine passes to the registry.
 * All fields are optional; the registry ranks candidates by how many they match.
 */
export interface AssetQuery {
  /** Must be able to play at least one of these types. */
  types?: EquipmentType[];
  /** Tags that should match (ranked higher the more they match). */
  tags?: string[];
  /** Preferred quality tier. If unavailable, falls back to any tier. */
  preferredTier?: QualityTier;
  /** If true, only return manifests whose glbPath resolves to an actual file. */
  requireLoaded?: boolean;
}

/**
 * Result of a registry query — the chosen manifest plus a score and the
 * reason it was chosen, for debugging.
 */
export interface AssetQueryResult {
  manifest: AssetManifest;
  score: number;
  matchedTags: string[];
}
