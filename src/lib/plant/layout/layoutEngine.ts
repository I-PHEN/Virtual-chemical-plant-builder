/**
 * Layout Engine — turns a PlantKnowledgeTemplate into a fully-placed PlantTemplate.
 *
 * This is the deterministic spatial brain. NO AI calls here. The layout is
 * computed from the knowledge template's stage order + flow graph + asset
 * registry footprints. Same input → same output, every time.
 *
 * Strategy (matches real industrial plot plans):
 *   1. Stages are laid out left-to-right (west → east) along the main process
 *      direction. Each stage = one process area.
 *   2. Utility/storage stages (kind !== "process") go to the back row (south).
 *   3. A central pipe rack runs east-west between the process row and the
 *      utility row, branching to each process area.
 *   4. Within a stage, equipment is arranged in a small grid around the
 *      area center, spaced by footprint size.
 *   5. Pipes route through the rack (up → along → down) when crossing between
 *      stages, or directly when within the same stage.
 *   6. Structures (platforms for tall equipment, bunds for storage, stairways
 *      for accessibility) are added automatically based on equipment type.
 */

import type {
  EquipmentInstance,
  PipeSegment,
  PlantTemplate,
  ProcessArea,
  PipeRackCorridor,
  Structure,
} from "../types";
import type { PlantKnowledgeTemplate, KnowledgeEquipment } from "../knowledge/types";
import { assetRegistry } from "../registry/registry";
import type { AssetManifest } from "../registry/manifest";

// ─────────── spacing constants (meters) ───────────
const PROCESS_ROW_Z = -10; // process stages sit north of rack
const UTILITY_ROW_Z = 22; // utility/storage sits south of rack
const RACK_Z = 6; // pipe rack runs along this z line
const STAGE_WIDTH = 22; // each stage area is this wide (x-axis)
const STAGE_DEPTH = 22; // each stage area is this deep (z-axis)
const STAGE_GAP = 6; // gap between adjacent stages
const INTRA_STAGE_SPACING = 9; // distance between equipment inside a stage
const RACK_HEIGHT = 7;
const RACK_LEVELS = 2;

/** Size-class → footprint (meters) when no GLB manifest exists. */
const SIZE_FOOTPRINT: Record<
  KnowledgeEquipment["sizeClass"],
  { w: number; d: number; h: number }
> = {
  small: { w: 3, d: 3, h: 3 },
  medium: { w: 5, d: 5, h: 8 },
  large: { w: 7, d: 7, h: 16 },
  huge: { w: 10, d: 10, h: 30 },
};

interface PlacedEquipment extends EquipmentInstance {
  stageId: string;
  footprint: { w: number; d: number; h: number };
  manifest?: AssetManifest;
}

/**
 * Compute the full layout for a knowledge template.
 *
 * @param template  The engineering truth (stages + flows, no coordinates).
 * @param plantId   Optional override for the resulting plant id.
 * @param plantName Optional override for the resulting plant name.
 * @returns         A fully-placed PlantTemplate ready for the scene.
 */
export function layoutPlant(
  template: PlantKnowledgeTemplate,
  options?: { plantId?: string; plantName?: string }
): PlantTemplate {
  // ─── 1. Place equipment, stage by stage ───
  const placed: PlacedEquipment[] = [];
  const areas: ProcessArea[] = [];

  // Stage index → x-center of that stage's area
  const stageCentersX = new Map<string, number>();
  let cursorX = 0;

  // First pass: assign x-centers to process stages (left → right)
  const processStages = template.stages.filter((s) => s.areaKind === "process");
  const utilityStages = template.stages.filter((s) => s.areaKind !== "process");

  processStages.forEach((stage, idx) => {
    const centerX = cursorX + STAGE_WIDTH / 2;
    stageCentersX.set(stage.id, centerX);
    cursorX += STAGE_WIDTH + STAGE_GAP;
  });

  // Utility stages get their own x-centers (in a row along the back)
  const utilityStartX = -STAGE_WIDTH * 1.5;
  utilityStages.forEach((stage, idx) => {
    stageCentersX.set(stage.id, utilityStartX + idx * (STAGE_WIDTH + STAGE_GAP));
  });

  // Second pass: place each equipment item within its stage
  for (const stage of template.stages) {
    const centerX = stageCentersX.get(stage.id) ?? 0;
    const rowZ = stage.areaKind === "process" ? PROCESS_ROW_Z : UTILITY_ROW_Z;

    // Lay equipment out in a 2-row grid inside the stage area
    const items = stage.equipment;
    const cols = Math.ceil(Math.sqrt(items.length));
    items.forEach((eq, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const offsetX = (col - (cols - 1) / 2) * INTRA_STAGE_SPACING;
      const offsetZ = (row - 0.5) * INTRA_STAGE_SPACING;
      const placed_item = placeEquipment(
        eq,
        template.id,
        centerX + offsetX,
        rowZ + offsetZ
      );
      placed_item.stageId = stage.id;
      placed.push(placed_item);
    });

    // Define the process area for this stage
    areas.push({
      id: `${template.id}-${stage.id}-area`,
      name: stage.name,
      kind: stage.areaKind,
      footprint: { x: centerX, z: rowZ, width: STAGE_WIDTH, depth: STAGE_DEPTH },
      bunded: stage.bunded ?? stage.areaKind === "storage",
      equipmentIds: stage.equipment.map((e) => e.id),
    });
  }

  // ─── 2. Build the central pipe rack ───
  const racks: PipeRackCorridor[] = [];
  if (processStages.length >= 2) {
    const firstX = stageCentersX.get(processStages[0].id) ?? 0;
    const lastX = stageCentersX.get(processStages[processStages.length - 1].id) ?? 0;
    racks.push({
      id: `${template.id}-main-rack`,
      from: { x: firstX - STAGE_WIDTH / 2, z: RACK_Z },
      to: { x: lastX + STAGE_WIDTH / 2, z: RACK_Z },
      height: RACK_HEIGHT,
      levels: RACK_LEVELS,
    });
  }

  // ─── 3. Generate pipes from flows ───
  const equipmentById = new Map(placed.map((p) => [p.id, p]));
  const pipes: PipeSegment[] = template.flows.map((flow, idx) => {
    const fromEq = equipmentById.get(flow.from);
    const toEq = equipmentById.get(flow.to);
    if (!fromEq || !toEq) {
      return {
        id: `${template.id}-pipe-${idx}`,
        from: flow.from,
        to: flow.to,
        stream: flow.stream,
        routing: "direct",
      };
    }
    const sameStage = (fromEq as PlacedEquipment).stageId === (toEq as PlacedEquipment).stageId;
    const crossesRow = Math.abs(fromEq.position[2] - toEq.position[2]) > STAGE_DEPTH;
    return {
      id: `${template.id}-pipe-${idx}`,
      from: flow.from,
      to: flow.to,
      stream: flow.stream,
      routing: sameStage || !crossesRow ? "direct" : "rack",
      rackId: sameStage || !crossesRow ? undefined : `${template.id}-main-rack`,
      label: flow.material,
    };
  });

  // ─── 4. Auto-generate structures (platforms, stairways, bunds) ───
  const structures: Structure[] = [];
  for (const eq of placed) {
    // Tall equipment gets a platform
    if (eq.footprint.h >= 15) {
      structures.push({
        id: `${eq.id}-platform`,
        kind: "platform",
        position: [eq.position[0], 0, eq.position[2]],
        size: [eq.footprint.w + 2, Math.min(eq.footprint.h * 0.4, 8), eq.footprint.d + 2],
      });
    }
    // Compressors and large equipment get a stairway access
    if (eq.type === "compressor" || eq.footprint.h >= 20) {
      structures.push({
        id: `${eq.id}-stairway`,
        kind: "stairway",
        position: [eq.position[0] + eq.footprint.w / 2 + 1, 0, eq.position[2]],
        rotation: Math.PI / 2,
      });
    }
  }

  // ─── 5. Build the process steps (one per stage, ordered by flow) ───
  const processSteps = template.stages.map((stage, idx) => ({
    order: idx + 1,
    title: stage.name,
    description: stage.description,
    equipmentId: stage.equipment[0]?.id ?? "",
  }));

  // ─── 6. Assemble the final PlantTemplate ───
  return {
    id: options?.plantId ?? template.id,
    name: options?.plantName ?? template.name,
    tagline: template.tagline,
    description: template.description,
    keywords: template.keywords,
    difficulty: template.difficulty,
    estimatedTime: template.estimatedTime,
    equipment: placed.map(({ stageId: _s, footprint: _f, manifest: _m, ...rest }) => rest),
    pipes,
    areas,
    racks,
    structures,
    processOverview: template.processOverview,
    processSteps,
    theme: template.theme
      ? {
          equipmentColor: template.theme.equipmentColor,
          structureColor: template.theme.structureColor,
          accent: template.theme.accent,
          mood: template.theme.mood,
          backdrop: template.theme.backdrop,
        }
      : undefined,
  };
}

/**
 * Place a single piece of equipment at a given (x, z) center.
 * Looks up the asset registry for a GLB manifest; if found, uses its footprint
 * and scale. Otherwise falls back to size-class defaults.
 */
function placeEquipment(
  eq: KnowledgeEquipment,
  plantId: string,
  x: number,
  z: number
): PlacedEquipment {
  // Try registry first
  const manifest = assetRegistry.pickForEquipment(eq.type, {
    plantId,
    tags: eq.assetTags,
    preferredTier: eq.sizeClass === "huge" || eq.sizeClass === "large" ? "hero" : "standard",
  });

  const footprint = manifest?.footprint ?? SIZE_FOOTPRINT[eq.sizeClass];
  const scale = manifest?.scale ?? 1;

  return {
    id: eq.id,
    type: eq.type,
    name: eq.name,
    position: [x, 0, z],
    scale,
    context: eq.contextOverride ?? eq.role,
    rotation: manifest?.rotationY ? [0, manifest.rotationY, 0] : undefined,
    stageId: "",
    footprint,
    manifest: manifest ?? undefined,
  };
}
