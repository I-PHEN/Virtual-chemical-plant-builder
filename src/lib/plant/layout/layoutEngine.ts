/**
 * Layout Engine — turns a PlantKnowledgeTemplate into a fully-placed PlantTemplate.
 *
 * This is the deterministic spatial brain. NO AI calls here. The layout is
 * computed from the knowledge template's stage order + flow graph + asset
 * registry footprints. Same input → same output, every time.
 *
 * Strategy (matches real industrial plot plans):
 *   1. Process stages are laid out in a SNAKE (boustrophedon) pattern:
 *      row 0 goes left→right, row 1 goes right→left, row 2 goes left→right.
 *      This keeps process flow contiguous while producing a roughly square
 *      footprint (e.g. 75×75m for 9 stages) instead of a 250m-long strip.
 *   2. Utility/storage stages get their own row at the back (south).
 *   3. A pipe rack follows the snake between rows, with short cross-racks
 *      connecting row ends.
 *   4. Within a stage, equipment is arranged in a small grid around the
 *      area center, spaced by footprint size.
 *   5. Pipes route through the rack when crossing between stages or rows,
 *      or directly when within the same stage.
 *   6. Structures (platforms for tall equipment, bunds for storage, stairways
 *      for accessibility) are added automatically based on equipment type.
 *
 * The plant is CENTERED on the origin so the camera (which starts looking at
 * (0,1,0)) sees the whole plant without needing to know the plant's dimensions.
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
const STAGE_WIDTH = 22; // each stage area is this wide (x-axis)
const STAGE_DEPTH = 22; // each stage area is this deep (z-axis)
const STAGE_GAP = 6; // gap between adjacent stages in a row
const ROW_GAP = 10; // gap between rows (for pipe rack + access)
const INTRA_STAGE_SPACING = 9; // distance between equipment inside a stage
const RACK_HEIGHT = 7;
const RACK_LEVELS = 2;

/** How many process stages per row before wrapping. 3 → 3×3 grid for 9 stages. */
const STAGES_PER_ROW = 3;

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

/** Row layout: z-center of the row + whether it goes left→right or right→left */
interface RowInfo {
  z: number;
  leftToRight: boolean;
}

/**
 * Compute the full layout for a knowledge template.
 */
export function layoutPlant(
  template: PlantKnowledgeTemplate,
  options?: { plantId?: string; plantName?: string }
): PlantTemplate {
  const processStages = template.stages.filter((s) => s.areaKind === "process");
  const utilityStages = template.stages.filter((s) => s.areaKind !== "process");

  // ─── 1. Assign each process stage to a row + column in the snake ───
  // Row 0 goes left→right, row 1 right→left, row 2 left→right, etc.
  const numRows = Math.ceil(processStages.length / STAGES_PER_ROW);
  const stagePositions = new Map<string, { x: number; z: number }>(); // stage.id → center

  // We'll compute positions first, then re-center everything on origin afterward.
  // Using a local coordinate system where row 0 starts at z=0.
  const rawPositions: { x: number; z: number }[] = [];

  processStages.forEach((stage, idx) => {
    const row = Math.floor(idx / STAGES_PER_ROW);
    const colInRow = idx % STAGES_PER_ROW;
    // Snake: even rows go left→right, odd rows go right→left
    const actualCol = row % 2 === 0 ? colInRow : STAGES_PER_ROW - 1 - colInRow;
    const x = actualCol * (STAGE_WIDTH + STAGE_GAP);
    const z = row * (STAGE_DEPTH + ROW_GAP);
    rawPositions.push({ x, z });
    stagePositions.set(stage.id, { x, z });
  });

  // Utility stages go in a row below the last process row
  const utilityZ = numRows * (STAGE_DEPTH + ROW_GAP);
  const utilityCount = utilityStages.length;
  // Center the utility row horizontally on the process block
  const processBlockWidth = STAGES_PER_ROW * STAGE_WIDTH + (STAGES_PER_ROW - 1) * STAGE_GAP;
  const utilityBlockWidth = utilityCount * STAGE_WIDTH + Math.max(0, (utilityCount - 1)) * STAGE_GAP;
  const utilityStartX = (processBlockWidth - utilityBlockWidth) / 2;

  utilityStages.forEach((stage, idx) => {
    const x = utilityStartX + idx * (STAGE_WIDTH + STAGE_GAP) + STAGE_WIDTH / 2;
    stagePositions.set(stage.id, { x, z: utilityZ });
  });

  // ─── 2. Re-center everything on the origin ───
  // Find the bounding box of all stage centers, then shift so the centroid is at (0, 0).
  const allCenters = Array.from(stagePositions.values());
  const minX = Math.min(...allCenters.map((p) => p.x)) - STAGE_WIDTH / 2;
  const maxX = Math.max(...allCenters.map((p) => p.x)) + STAGE_WIDTH / 2;
  const minZ = Math.min(...allCenters.map((p) => p.z)) - STAGE_DEPTH / 2;
  const maxZ = Math.max(...allCenters.map((p) => p.z)) + STAGE_DEPTH / 2;
  const centerX = (minX + maxX) / 2;
  const centerZ = (minZ + maxZ) / 2;

  // Shift all stage positions so the plant centroid is at origin
  for (const [key, pos] of stagePositions.entries()) {
    stagePositions.set(key, { x: pos.x - centerX, z: pos.z - centerZ });
  }

  // ─── 3. Place equipment within each stage ───
  const placed: PlacedEquipment[] = [];
  const areas: ProcessArea[] = [];

  for (const stage of template.stages) {
    const pos = stagePositions.get(stage.id) ?? { x: 0, z: 0 };
    const items = stage.equipment;
    const cols = Math.max(1, Math.ceil(Math.sqrt(items.length)));
    items.forEach((eq, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const offsetX = (col - (cols - 1) / 2) * INTRA_STAGE_SPACING;
      const offsetZ = (row - (items.length > cols ? 1 : 0.5)) * INTRA_STAGE_SPACING;
      const p = placeEquipment(eq, template.id, pos.x + offsetX, pos.z + offsetZ);
      p.stageId = stage.id;
      placed.push(p);
    });

    areas.push({
      id: `${template.id}-${stage.id}-area`,
      name: stage.name,
      kind: stage.areaKind,
      footprint: { x: pos.x, z: pos.z, width: STAGE_WIDTH, depth: STAGE_DEPTH },
      bunded: stage.bunded ?? stage.areaKind === "storage",
      equipmentIds: stage.equipment.map((e) => e.id),
    });
  }

  // ─── 4. Build pipe racks following the snake ───
  const racks: PipeRackCorridor[] = [];

  // One rack segment per row of process stages, running along the row centerline
  for (let row = 0; row < numRows; row++) {
    const rowStages = processStages.slice(
      row * STAGES_PER_ROW,
      Math.min((row + 1) * STAGES_PER_ROW, processStages.length)
    );
    if (rowStages.length < 2) continue;
    const firstPos = stagePositions.get(rowStages[0].id)!;
    const lastPos = stagePositions.get(rowStages[rowStages.length - 1].id)!;
    // Rack runs along the edge between this row and the next (or utility row)
    const rackZ = firstPos.z + STAGE_DEPTH / 2 + ROW_GAP / 2;
    racks.push({
      id: `${template.id}-rack-row${row}`,
      from: { x: Math.min(firstPos.x, lastPos.x) - STAGE_WIDTH / 2, z: rackZ },
      to: { x: Math.max(firstPos.x, lastPos.x) + STAGE_WIDTH / 2, z: rackZ },
      height: RACK_HEIGHT,
      levels: RACK_LEVELS,
    });

    // If there's a next row, add a cross-rack connecting the end of this row
    // to the start of the next row (following the snake turn)
    if (row < numRows - 1) {
      const nextRowStages = processStages.slice(
        (row + 1) * STAGES_PER_ROW,
        Math.min((row + 2) * STAGES_PER_ROW, processStages.length)
      );
      if (nextRowStages.length > 0) {
        // The snake turns: the end of this row connects to the start of the next
        const turnStageThis = row % 2 === 0 ? rowStages[rowStages.length - 1] : rowStages[0];
        const turnStageNext = row % 2 === 0 ? nextRowStages[0] : nextRowStages[nextRowStages.length - 1];
        const turnPosThis = stagePositions.get(turnStageThis.id)!;
        const turnPosNext = stagePositions.get(turnStageNext.id)!;
        racks.push({
          id: `${template.id}-rack-turn${row}`,
          from: { x: turnPosThis.x, z: turnPosThis.z + STAGE_DEPTH / 2 + ROW_GAP / 2 },
          to: { x: turnPosNext.x, z: turnPosNext.z - STAGE_DEPTH / 2 - ROW_GAP / 2 },
          height: RACK_HEIGHT,
          levels: RACK_LEVELS,
        });
      }
    }
  }

  // ─── 4b. Re-center on the ACTUAL equipment bounding box ───
  // The stage-center centering above gets us close, but equipment offsets
  // (intra-stage grid) push the actual bounding box off-center. Shift
  // everything so the true equipment centroid is at (0, 0). This ensures
  // the camera (which starts looking at origin) sees the whole plant.
  if (placed.length > 0) {
    const eqXs = placed.map((p) => p.position[0]);
    const eqZs = placed.map((p) => p.position[2]);
    const eqCenterX = (Math.min(...eqXs) + Math.max(...eqXs)) / 2;
    const eqCenterZ = (Math.min(...eqZs) + Math.max(...eqZs)) / 2;
    for (const p of placed) {
      p.position[0] -= eqCenterX;
      p.position[2] -= eqCenterZ;
    }
    for (const area of areas) {
      area.footprint.x -= eqCenterX;
      area.footprint.z -= eqCenterZ;
    }
    for (const rack of racks) {
      rack.from.x -= eqCenterX;
      rack.from.z -= eqCenterZ;
      rack.to.x -= eqCenterX;
      rack.to.z -= eqCenterZ;
    }
  }

  // ─── 5. Generate pipes from flows ───
  const equipmentById = new Map(placed.map((p) => [p.id, p]));
  const allRackIds = new Set(racks.map((r) => r.id));
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
    const distance = Math.hypot(
      fromEq.position[0] - toEq.position[0],
      fromEq.position[2] - toEq.position[2]
    );
    // Route through rack if crossing stages AND more than 15m apart
    const useRack = !sameStage && distance > 15 && allRackIds.size > 0;
    return {
      id: `${template.id}-pipe-${idx}`,
      from: flow.from,
      to: flow.to,
      stream: flow.stream,
      routing: useRack ? "rack" : "direct",
      rackId: useRack ? racks[0]?.id : undefined,
      label: flow.material,
    };
  });

  // ─── 6. Auto-generate structures (platforms, stairways) ───
  const structures: Structure[] = [];
  for (const eq of placed) {
    if (eq.footprint.h >= 15) {
      structures.push({
        id: `${eq.id}-platform`,
        kind: "platform",
        position: [eq.position[0], 0, eq.position[2]],
        size: [eq.footprint.w + 2, Math.min(eq.footprint.h * 0.4, 8), eq.footprint.d + 2],
      });
    }
    if (eq.type === "compressor" || eq.footprint.h >= 20) {
      structures.push({
        id: `${eq.id}-stairway`,
        kind: "stairway",
        position: [eq.position[0] + eq.footprint.w / 2 + 1, 0, eq.position[2]],
        rotation: Math.PI / 2,
      });
    }
  }

  // ─── 7. Build the process steps (one per stage, ordered by flow) ───
  const processSteps = template.stages.map((stage, idx) => ({
    order: idx + 1,
    title: stage.name,
    description: stage.description,
    equipmentId: stage.equipment[0]?.id ?? "",
  }));

  // ─── 8. Assemble the final PlantTemplate ───
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
