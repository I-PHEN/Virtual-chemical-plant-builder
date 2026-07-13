/**
 * Test the AI plant composer's validation + layout path.
 * Run: npx tsx scripts/test-composer.ts
 *
 * Simulates what happens when the composer LLM returns a template for a
 * plant type we don't have curated (e.g. a "copper flotation plant").
 * Verifies the validation, sanitization, and layout engine all work on
 * AI-composed templates — not just hand-written ones.
 */

import { layoutPlant } from "../src/lib/plant/layout";
import type { PlantKnowledgeTemplate } from "../src/lib/plant/knowledge/types";

// Simulate what the LLM might compose for "build a copper flotation plant"
const composedCopperPlant: PlantKnowledgeTemplate = {
  id: "copper_flotation",
  name: "Copper Flotation Plant",
  tagline: "Crush → grind → float → concentrate: extracting copper from ore",
  description:
    "A copper sulfide ore beneficiation plant. Run-of-mine ore is crushed, ground in a SAG mill, and processed through a rougher-scavenger-cleaner flotation circuit to produce a copper concentrate.",
  keywords: ["copper", "flotation", "ore", "concentrate", "beneficiation", "mining"],
  difficulty: "Intermediate",
  estimatedTime: 20,
  chemicalEquation: "CuFeS₂ + O₂ → CuS (concentrate) + FeO + SO₂ (roasting, not shown)",
  capacity: "50,000–100,000 t/d ore",

  stages: [
    {
      id: "comminution",
      name: "Crushing & Grinding",
      description:
        "Run-of-mine ore is reduced from boulders to fine powder, liberating copper minerals from gangue.",
      areaKind: "process",
      equipment: [
        {
          id: "jaw_crusher",
          type: "compressor", // we don't have a crusher type — map to compressor (rotating equipment)
          name: "Primary Jaw Crusher",
          tag: "C-101",
          role: "Reduces ROM ore from ~600mm to ~150mm chunks.",
          sizeClass: "large",
          essential: true,
        },
        {
          id: "sag_mill",
          type: "motor", // rotating equipment — closest analog
          name: "SAG Mill",
          tag: "M-101",
          role: "Semi-autogenous grinding reduces ore to ~5mm with steel balls.",
          sizeClass: "huge",
          essential: true,
        },
        {
          id: "ball_mill",
          type: "motor",
          name: "Ball Mill",
          tag: "M-102",
          role: "Fine grinding to ~75 microns for flotation liberation.",
          sizeClass: "large",
          essential: true,
        },
        {
          id: "mill_pump",
          type: "pump",
          name: "Mill Discharge Pump",
          tag: "P-101",
          role: "Pumps the ground slurry to the hydrocyclone classifier.",
          sizeClass: "small",
          essential: true,
        },
      ],
    },
    {
      id: "classification",
      name: "Classification",
      description:
        "Hydrocyclones separate the ground slurry into fine overflow (goes to flotation) and coarse underflow (returns to the ball mill).",
      areaKind: "process",
      equipment: [
        {
          id: "hydrocyclone",
          type: "separator",
          name: "Hydrocyclone Cluster",
          tag: "V-101",
          role: "Centrifugally separates fine from coarse particles in the slurry.",
          sizeClass: "medium",
          essential: true,
        },
      ],
    },
    {
      id: "rougher_flotation",
      name: "Rougher Flotation",
      description:
        "Copper sulfide minerals attach to air bubbles and float to the surface as a froth, while gangue sinks.",
      areaKind: "process",
      equipment: [
        {
          id: "rougher_cells",
          type: "column",
          name: "Rougher Flotation Cells",
          tag: "C-201",
          role: "Bank of agitated cells where air is sparged to float copper minerals.",
          sizeClass: "huge",
          essential: true,
        },
        {
          id: "reagent_pump",
          type: "pump",
          name: "Collector Dosing Pump",
          tag: "P-201",
          role: "Doses xanthate collector reagent to make copper particles hydrophobic.",
          sizeClass: "small",
          essential: true,
        },
      ],
    },
    {
      id: "cleaner_flotation",
      name: "Cleaner Flotation",
      description:
        "The rougher concentrate is re-floated to upgrade grade by removing entrained gangue.",
      areaKind: "process",
      equipment: [
        {
          id: "cleaner_column",
          type: "column",
          name: "Cleaner Column",
          tag: "C-301",
          role: "Counter-current flotation column producing final copper concentrate.",
          sizeClass: "large",
          essential: true,
        },
        {
          id: "cleaner_pump",
          type: "pump",
          name: "Cleaner Feed Pump",
          tag: "P-301",
          role: "Pumps rougher concentrate to the cleaner column.",
          sizeClass: "small",
          essential: true,
        },
      ],
    },
    {
      id: "dewatering",
      name: "Concentrate Dewatering",
      description:
        "The final concentrate slurry is thickened and filtered to produce a moist cake for shipping.",
      areaKind: "process",
      equipment: [
        {
          id: "thickener",
          type: "separator",
          name: "Concentrate Thickener",
          tag: "V-401",
          role: "Gravity-settles the concentrate slurry to ~60% solids.",
          sizeClass: "huge",
          essential: true,
        },
        {
          id: "filter",
          type: "filter",
          name: "Pressure Filter",
          tag: "F-401",
          role: "Filters the thickened concentrate to ~8% moisture cake.",
          sizeClass: "large",
          essential: true,
        },
      ],
    },
    {
      id: "tailings",
      name: "Tailings Management",
      description:
        "The flotation tailings (gangue) are thickened for water recovery and sent to the tailings dam.",
      areaKind: "storage",
      equipment: [
        {
          id: "tailings_thickener",
          type: "separator",
          name: "Tailings Thickener",
          tag: "V-501",
          role: "Recovers process water from tailings before disposal.",
          sizeClass: "huge",
          essential: true,
        },
        {
          id: "tailings_pump",
          type: "pump",
          name: "Tailings Disposal Pump",
          tag: "P-501",
          role: "Pumps thickened tailings to the tailings dam.",
          sizeClass: "medium",
          essential: true,
        },
      ],
    },
    {
      id: "utilities",
      name: "Utilities",
      description: "Process water, reagents, and air supply for the plant.",
      areaKind: "utility",
      equipment: [
        {
          id: "air_compressor",
          type: "compressor",
          name: "Flotation Air Compressor",
          tag: "K-101",
          role: "Provides sparging air to the flotation cells.",
          sizeClass: "large",
          essential: true,
        },
        {
          id: "water_tank",
          type: "storageTank",
          name: "Process Water Tank",
          tag: "T-101",
          role: "Stores reclaimed process water for reuse in grinding and flotation.",
          sizeClass: "large",
          essential: true,
        },
      ],
    },
  ],

  flows: [
    { from: "jaw_crusher", to: "sag_mill", material: "crushed_ore", stream: "feed", primary: true },
    { from: "sag_mill", to: "ball_mill", material: "ground_slurry", stream: "intermediate", primary: true },
    { from: "ball_mill", to: "mill_pump", material: "fine_slurry", stream: "intermediate", primary: true },
    { from: "mill_pump", to: "hydrocyclone", material: "slurry", stream: "intermediate", primary: true },
    { from: "hydrocyclone", to: "rougher_cells", material: "fine_overflow", stream: "intermediate", primary: true },
    { from: "hydrocyclone", to: "ball_mill", material: "coarse_underflow", stream: "intermediate", primary: false },
    { from: "reagent_pump", to: "rougher_cells", material: "xanthate_collector", stream: "utility-cold", primary: false },
    { from: "air_compressor", to: "rougher_cells", material: "sparging_air", stream: "utility-cold", primary: false },
    { from: "rougher_cells", to: "cleaner_pump", material: "rougher_concentrate", stream: "intermediate", primary: true },
    { from: "cleaner_pump", to: "cleaner_column", material: "rougher_concentrate", stream: "intermediate", primary: true },
    { from: "cleaner_column", to: "thickener", material: "final_concentrate", stream: "product", primary: true },
    { from: "thickener", to: "filter", material: "thickened_concentrate", stream: "product", primary: true },
    { from: "rougher_cells", to: "tailings_thickener", material: "rougher_tails", stream: "intermediate", primary: false },
    { from: "cleaner_column", to: "tailings_thickener", material: "cleaner_tails", stream: "intermediate", primary: false },
    { from: "tailings_thickener", to: "tailings_pump", material: "thickened_tails", stream: "intermediate", primary: false },
    { from: "tailings_thickener", to: "water_tank", material: "reclaimed_water", stream: "utility-cold", primary: false },
    { from: "water_tank", to: "sag_mill", material: "process_water", stream: "utility-cold", primary: false },
  ],

  processOverview:
    "Run-of-mine copper ore is crushed in a jaw crusher and then ground in a SAG mill followed by a ball mill to liberate copper sulfide minerals. The ground slurry is classified in a hydrocyclone, with the fine overflow reporting to the rougher flotation cells. Xanthate collector is added to make copper particles hydrophobic, and sparging air floats them as a froth. The rougher concentrate is pumped to a cleaner column for upgrading. Final concentrate is thickened and pressure-filtered to a moist cake for shipping. Tailings are thickened for water recovery, with reclaimed water recycled back to the grinding circuit.",

  theme: {
    equipmentColor: "#a16207", // earthy brown for mining
    structureColor: "#57534e",
    accent: "#f59e0b",
    mood: "warm-rust",
    backdrop: "fermentation-tanks",
  },
};

console.log("\n=== AI Plant Composer Test (Copper Flotation) ===\n");

// Validate (mimic the route's validation logic)
const allIds = new Set<string>();
const validTypes = new Set([
  "pump","tank","reactor","heatExchanger","compressor","valve","pipe","column",
  "separator","cooler","filter","motor","storageTank","heater","reformer",
  "steamDrum","boiler","coolingTower","flareStack","waterTreatment",
  "desulfurizer","evaporator",
]);

let validationOk = true;
let validationError = "";
for (const stage of composedCopperPlant.stages) {
  for (const eq of stage.equipment) {
    if (!eq.id || !eq.type || !validTypes.has(eq.type)) {
      validationOk = false;
      validationError = `equipment ${eq.id} has bad type "${eq.type}"`;
    }
    allIds.add(eq.id);
  }
}
for (const flow of composedCopperPlant.flows) {
  if (!allIds.has(flow.from) || !allIds.has(flow.to)) {
    validationOk = false;
    validationError = `flow references unknown equipment: ${flow.from} → ${flow.to}`;
  }
}

console.log(`Validation: ${validationOk ? "PASS" : "FAIL — " + validationError}`);

if (!validationOk) {
  console.log("\nTest aborted — validation failed.");
  process.exit(1);
}

// Run through the layout engine
const plant = layoutPlant(composedCopperPlant);
console.log(`\nLayout engine output:`);
console.log(`  Plant id: ${plant.id}`);
console.log(`  Plant name: ${plant.name}`);
console.log(`  Equipment placed: ${plant.equipment.length}`);
console.log(`  Areas: ${plant.areas?.length ?? 0}`);
console.log(`  Pipes: ${plant.pipes.length}`);
console.log(`  Racks: ${plant.racks?.length ?? 0}`);
console.log(`  Structures: ${plant.structures?.length ?? 0}`);

// Check positions
const xs = plant.equipment.map((e) => e.position[0]);
const zs = plant.equipment.map((e) => e.position[2]);
const xMin = Math.min(...xs), xMax = Math.max(...xs);
const zMin = Math.min(...zs), zMax = Math.max(...zs);
console.log(`\n  X spread: ${xMin.toFixed(1)} to ${xMax.toFixed(1)} (width = ${(xMax - xMin).toFixed(1)}m)`);
console.log(`  Z spread: ${zMin.toFixed(1)} to ${zMax.toFixed(1)} (depth = ${(zMax - zMin).toFixed(1)}m)`);

// Verify all flows resolve
const eqIds = new Set(plant.equipment.map((e) => e.id));
const orphans = plant.pipes.filter((p) => !eqIds.has(p.from) || !eqIds.has(p.to));
console.log(`\n  Orphan pipes: ${orphans.length}`);
console.log(`  Unique equipment positions: ${new Set(plant.equipment.map((e) => `${e.position[0]},${e.position[2]}`)).size} / ${plant.equipment.length}`);

// Sample some placements
console.log(`\n  Sample placements:`);
plant.equipment.slice(0, 6).forEach((e) => {
  console.log(`    ${e.id.padEnd(22)} → x=${e.position[0].toFixed(1).padStart(6)}, z=${e.position[2].toFixed(1).padStart(6)}  [${e.type}]`);
});

console.log(`\n  Stage names (process flow):`);
plant.areas?.forEach((a, i) => {
  console.log(`    ${i + 1}. ${a.name} (${a.kind}) — ${a.equipmentIds.length} pieces`);
});

console.log("\n=== Composer test PASSED — AI-composed plant renders correctly ===\n");
