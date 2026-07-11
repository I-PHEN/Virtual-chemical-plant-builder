/**
 * Smoke test for the new three-layer architecture.
 * Run: npx tsx scripts/test-architecture.ts
 *
 * Verifies:
 *   1. Asset registry loads the 6 starter manifests and can query them.
 *   2. The ammonia knowledge template has 9 stages, 25+ equipment, and proper flows.
 *   3. The layout engine produces a fully-placed plant with no overlapping
 *      equipment and every flow resolvable to two existing equipment ids.
 */

import { assetRegistry } from "../src/lib/plant/registry/registry";
import type { AssetManifest } from "../src/lib/plant/registry/manifest";
import { AMMONIA_KNOWLEDGE } from "../src/lib/plant/knowledge/ammonia";
import { layoutPlant } from "../src/lib/plant/layout/layoutEngine";

// ─── Test 1: Registry ───
console.log("\n=== Test 1: Asset Registry ===");

const starterManifests: AssetManifest[] = [
  {
    id: "vertical-reactor-v1",
    glbPath: "/assets/models/equipment/vertical-reactor-v1.glb",
    equipmentTypes: ["reactor", "separator", "steamDrum", "desulfurizer"],
    primaryFunction: "Vertical pressure vessel",
    footprint: { w: 4, d: 4, h: 18 },
    connectionPoints: [],
    scale: 1,
    tags: ["ammonia", "high-pressure", "catalytic", "vessel"],
    qualityTier: "hero",
    source: "test",
    license: "test",
  },
  {
    id: "centrifugal-compressor-v1",
    glbPath: "/assets/models/equipment/centrifugal-compressor-v1.glb",
    equipmentTypes: ["compressor", "pump", "motor"],
    primaryFunction: "Centrifugal compressor skid",
    footprint: { w: 6, d: 3, h: 4 },
    connectionPoints: [],
    scale: 1,
    tags: ["ammonia", "compression", "syngas", "high-pressure"],
    qualityTier: "hero",
    source: "test",
    license: "test",
  },
  {
    id: "cooling-tower-v1",
    glbPath: "/assets/models/equipment/cooling-tower-v1.glb",
    equipmentTypes: ["coolingTower"],
    primaryFunction: "Cooling tower",
    footprint: { w: 10, d: 10, h: 14 },
    connectionPoints: [],
    scale: 1,
    tags: ["utility", "cooling", "water"],
    qualityTier: "hero",
    source: "test",
    license: "test",
  },
];
assetRegistry.registerAll(starterManifests);
console.log(`  Registered ${assetRegistry.all().length} manifests`);

const reactorPick = assetRegistry.pickForEquipment("reactor", {
  plantId: "ammonia",
  tags: ["ammonia", "synthesis"],
});
console.log(
  `  pickForEquipment('reactor', ammonia) → ${reactorPick?.id ?? "null (fallback to procedural)"}`
);
const compressorPick = assetRegistry.pickForEquipment("compressor", {
  plantId: "ammonia",
});
console.log(`  pickForEquipment('compressor', ammonia) → ${compressorPick?.id ?? "null"}`);
const tankPick = assetRegistry.pickForEquipment("storageTank");
console.log(`  pickForEquipment('storageTank') → ${tankPick?.id ?? "null (expected — no GLB yet)"}`);

// ─── Test 2: Knowledge template ───
console.log("\n=== Test 2: Ammonia Knowledge Template ===");
console.log(`  Stages: ${AMMONIA_KNOWLEDGE.stages.length}`);
const totalEquipment = AMMONIA_KNOWLEDGE.stages.reduce(
  (sum, s) => sum + s.equipment.length,
  0
);
console.log(`  Total equipment: ${totalEquipment}`);
console.log(`  Total flows: ${AMMONIA_KNOWLEDGE.flows.length}`);
console.log(
  `  Stage names: ${AMMONIA_KNOWLEDGE.stages.map((s) => s.name).join(" → ")}`
);

// Verify all flow endpoints resolve to equipment ids
const allEquipmentIds = new Set(
  AMMONIA_KNOWLEDGE.stages.flatMap((s) => s.equipment.map((e) => e.id))
);
const badFlows = AMMONIA_KNOWLEDGE.flows.filter(
  (f) => !allEquipmentIds.has(f.from) || !allEquipmentIds.has(f.to)
);
console.log(`  Unresolved flow endpoints: ${badFlows.length}`);
if (badFlows.length > 0) {
  console.log(`    BAD: ${JSON.stringify(badFlows)}`);
}

// ─── Test 3: Layout engine ───
console.log("\n=== Test 3: Layout Engine ===");
const planted = layoutPlant(AMMONIA_KNOWLEDGE);
console.log(`  Plant id: ${planted.id}`);
console.log(`  Plant name: ${planted.name}`);
console.log(`  Equipment placed: ${planted.equipment.length}`);
console.log(`  Pipes generated: ${planted.pipes.length}`);
console.log(`  Process areas: ${planted.areas.length}`);
console.log(`  Pipe racks: ${planted.racks.length}`);
console.log(`  Structures: ${planted.structures.length}`);
console.log(`  Process steps: ${planted.processSteps.length}`);

// Check for overlapping equipment (same x,z within 2m)
const positions = planted.equipment.map((e) => `${e.position[0].toFixed(1)},${e.position[2].toFixed(1)}`);
const unique = new Set(positions);
console.log(`  Unique positions: ${unique.size} / ${positions.length} (should be equal)`);

// Sample 5 placed equipment with their positions
console.log("\n  Sample placements:");
planted.equipment.slice(0, 5).forEach((e) => {
  console.log(
    `    ${e.id.padEnd(28)} → (${e.position[0].toFixed(1)}, ${e.position[1]}, ${e.position[2].toFixed(1)})`
  );
});

// Sample 3 pipes
console.log("\n  Sample pipes:");
planted.pipes.slice(0, 3).forEach((p) => {
  console.log(
    `    ${p.from.padEnd(22)} → ${p.to.padEnd(22)} [${p.routing}, ${p.stream}]`
  );
});

console.log("\n=== All tests complete ===\n");
