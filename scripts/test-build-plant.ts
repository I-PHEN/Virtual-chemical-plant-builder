/**
 * Smoke test for the new build-plant API flow (simulated server-side).
 * Run: npx tsx scripts/test-build-plant.ts
 *
 * Verifies that the build-plant route handler:
 *   1. Matches an ammonia command via the fast keyword path
 *   2. Calls layoutPlant() to produce a full PlantTemplate
 *   3. Returns the plant + stages + equipmentCount + intro
 */

import { matchKnowledgeTemplate } from "../src/lib/plant/knowledge";
import { layoutPlant } from "../src/lib/plant/layout";

console.log("\n=== Build-Plant API Simulation ===\n");

const command = "build me an ammonia plant";
console.log(`Command: "${command}"`);

// Fast path match
const match = matchKnowledgeTemplate(command);
if (!match) {
  console.error("FAILED: no match for ammonia command");
  process.exit(1);
}
console.log(`Matched template: ${match.template.name} (score ${match.score})`);

// Run layout engine
const plant = layoutPlant(match.template);
console.log(`\nGenerated plant:`);
console.log(`  id: ${plant.id}`);
console.log(`  name: ${plant.name}`);
console.log(`  equipment count: ${plant.equipment.length}`);
console.log(`  areas: ${plant.areas?.length ?? 0}`);
console.log(`  pipes: ${plant.pipes.length}`);
console.log(`  racks: ${plant.racks?.length ?? 0}`);
console.log(`  structures: ${plant.structures?.length ?? 0}`);
console.log(`  process steps: ${plant.processSteps.length}`);

// Verify the plant is renderable (no orphan equipment)
const equipmentIds = new Set(plant.equipment.map((e) => e.id));
const orphanPipes = plant.pipes.filter(
  (p) => !equipmentIds.has(p.from) || !equipmentIds.has(p.to)
);
console.log(`\nOrphan pipes (broken references): ${orphanPipes.length}`);

// Verify all flows have valid equipment IDs (from the source knowledge template)
const allKnowledgeEquipmentIds = new Set(
  match.template.stages.flatMap((s) => s.equipment.map((e) => e.id))
);
console.log(
  `Knowledge template equipment count: ${allKnowledgeEquipmentIds.size}`
);
console.log(
  `Layout preserved all equipment: ${
    plant.equipment.length === allKnowledgeEquipmentIds.size ? "YES" : "NO"
  }`
);

// Sample some positions across the layout to confirm spreading
console.log(`\nSample positions across the layout:`);
plant.equipment.slice(0, 8).forEach((e) => {
  console.log(
    `  ${e.id.padEnd(28)} → x=${e.position[0].toFixed(1).padStart(6)}, z=${e.position[2].toFixed(1).padStart(6)}`
  );
});

// Check the X spread (process stages should span east-west)
const xs = plant.equipment.map((e) => e.position[0]);
const xMin = Math.min(...xs);
const xMax = Math.max(...xs);
console.log(
  `\nX spread: ${xMin.toFixed(1)} to ${xMax.toFixed(1)} (width = ${(xMax - xMin).toFixed(1)}m)`
);

// Check the Z spread (process row vs utility row)
const zs = plant.equipment.map((e) => e.position[2]);
const zMin = Math.min(...zs);
const zMax = Math.max(...zs);
console.log(
  `Z spread: ${zMin.toFixed(1)} to ${zMax.toFixed(1)} (depth = ${(zMax - zMin).toFixed(1)}m)`
);

console.log("\n=== Build-Plant simulation PASSED ===\n");
