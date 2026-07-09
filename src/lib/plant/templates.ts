import type { PlantTemplate } from "./types";

/**
 * Square-footprint plant layouts.
 *
 * Equipment is spread on BOTH X and Z axes (roughly 60x60m), with the
 * pipe rack running down the middle and equipment on both sides — like
 * a real industrial plot plan. No more long thin lines.
 */

export const PLANT_TEMPLATES: PlantTemplate[] = [
  // ───────────────────────────── AMMONIA ─────────────────────────────
  {
    id: "ammonia",
    name: "Ammonia Plant (Haber–Bosch)",
    tagline: "N₂ + 3 H₂ → 2 NH₃ at high pressure over an iron catalyst",
    description:
      "A Haber–Bosch ammonia synthesis loop. Nitrogen and hydrogen are compressed to high pressure, preheated, fed to a catalytic reactor, cooled, and the condensed ammonia is separated from the recycle gas.",
    keywords: ["ammonia", "haber", "bosch", "nh3", "synthesis gas", "fertiliser", "fertilizer"],
    difficulty: "Beginner",
    estimatedTime: 12,
    equipment: [
      // West side (north to south)
      { id: "nh3-feed-tank", type: "tank", name: "Feed Tank (H₂ + N₂ mix)", position: [-22, 0, -18], context: "Holds the stoichiometric synthesis-gas mixture (3 H₂ : 1 N₂) before compression." },
      { id: "nh3-compressor", type: "compressor", name: "Syngas Compressor K-101", position: [-22, 0, -6], context: "Raises the synthesis gas from near-atmospheric to roughly 150 bar." },
      { id: "nh3-feedheater", type: "heatExchanger", name: "Feed/Effluent Exchanger E-101", position: [-22, 0, 6], context: "Recovers heat from the hot reactor effluent to preheat the cold feed." },

      // Center (reactor — the heart)
      { id: "nh3-reactor", type: "reactor", name: "Ammonia Converter R-101", position: [0, 0, 0], context: "Fixed-bed catalytic reactor with iron catalyst. Exothermic: N₂ + 3 H₂ ⇌ 2 NH₃." },

      // East side (north to south)
      { id: "nh3-cooler", type: "cooler", name: "Ammonia Condenser E-102", position: [22, 0, -6], context: "Cools the reactor effluent so ammonia condenses while unreacted gas stays gaseous." },
      { id: "nh3-separator", type: "separator", name: "Ammonia Separator V-101", position: [22, 0, 6], context: "Splits liquid ammonia (bottom) from unreacted recycle gas (top)." },
      { id: "nh3-storage", type: "storageTank", name: "Ammonia Storage Tank", position: [22, 0, 18], context: "Refrigerated atmospheric tank storing liquid ammonia before dispatch." },
    ],
    pipes: [
      { id: "nh3-p1", from: "nh3-feed-tank", to: "nh3-compressor", stream: "feed", routing: "direct" },
      { id: "nh3-p2", from: "nh3-compressor", to: "nh3-feedheater", stream: "intermediate", routing: "rack", rackId: "nh3-rack1" },
      { id: "nh3-p3", from: "nh3-feedheater", to: "nh3-reactor", stream: "intermediate", routing: "rack", rackId: "nh3-rack1" },
      { id: "nh3-p4", from: "nh3-reactor", to: "nh3-feedheater", stream: "product", routing: "rack", rackId: "nh3-rack1" },
      { id: "nh3-p5", from: "nh3-reactor", to: "nh3-cooler", stream: "product", routing: "rack", rackId: "nh3-rack1" },
      { id: "nh3-p6", from: "nh3-cooler", to: "nh3-separator", stream: "product", routing: "rack", rackId: "nh3-rack1" },
      { id: "nh3-p7", from: "nh3-separator", to: "nh3-storage", stream: "product", routing: "direct" },
    ],
    areas: [
      { id: "nh3-area-a", name: "Syngas Prep", kind: "process", footprint: { x: -22, z: 0, width: 16, depth: 30 }, equipmentIds: ["nh3-feed-tank", "nh3-compressor", "nh3-feedheater"] },
      { id: "nh3-area-b", name: "Synthesis", kind: "process", footprint: { x: 0, z: 0, width: 12, depth: 12 }, equipmentIds: ["nh3-reactor"] },
      { id: "nh3-area-c", name: "Separation & Storage", kind: "storage", footprint: { x: 22, z: 6, width: 16, depth: 30 }, bunded: true, equipmentIds: ["nh3-cooler", "nh3-separator", "nh3-storage"] },
    ],
    racks: [
      { id: "nh3-rack1", from: { x: -22, z: 0 }, to: { x: 22, z: 0 }, height: 7, levels: 2 },
    ],
    structures: [
      { id: "nh3-platform1", kind: "platform", position: [0, 0, 0], size: [4, 5, 4] },
    ],
    processOverview:
      "Nitrogen and hydrogen are compressed to ~150 bar, preheated by exchange with the hot reactor effluent, and passed over an iron catalyst in the converter. Only a fraction converts per pass, so the unreacted gas is recycled. The effluent is cooled so ammonia condenses; the liquid is separated and stored.",
    processSteps: [
      { order: 1, title: "Feed storage", description: "The stoichiometric 3:1 H₂/N₂ synthesis gas is held in the feed tank.", equipmentId: "nh3-feed-tank" },
      { order: 2, title: "Compression", description: "The syngas compressor raises the gas to ~150 bar.", equipmentId: "nh3-compressor" },
      { order: 3, title: "Feed preheat", description: "The cold feed recovers heat from the hot reactor effluent.", equipmentId: "nh3-feedheater" },
      { order: 4, title: "Reaction", description: "N₂ and H₂ combine exothermically over iron catalyst to form ammonia.", equipmentId: "nh3-reactor" },
      { order: 5, title: "Cooling", description: "The effluent is cooled so ammonia liquefies.", equipmentId: "nh3-cooler" },
      { order: 6, title: "Separation", description: "Liquid ammonia drops to the bottom, recycle gas rises to the top.", equipmentId: "nh3-separator" },
      { order: 7, title: "Storage", description: "Liquid ammonia is sent to the refrigerated storage tank.", equipmentId: "nh3-storage" },
    ],
  },

  // ─────────────────────────── DISTILLATION ───────────────────────────
  {
    id: "distillation",
    name: "Distillation Plant",
    tagline: "Separates a binary mixture by boiling point using a tray column",
    description:
      "A continuous distillation train: a feed tank, a feed pump, a preheater, a tray column with condenser and reboiler, and two product tanks. A textbook binary separation unit.",
    keywords: ["distillation", "distill", "separation", "column", "reflux", "binary", "tray"],
    difficulty: "Beginner",
    estimatedTime: 15,
    equipment: [
      // South side (west to east)
      { id: "dist-feed-tank", type: "tank", name: "Feed Tank", position: [-22, 0, 18], context: "Holds the binary feed mixture (e.g. methanol/water) at ambient temperature." },
      { id: "dist-pump", type: "pump", name: "Feed Pump P-101", position: [-10, 0, 18], context: "Pumps the feed through the preheater and into the column at the feed tray." },
      { id: "dist-preheater", type: "heatExchanger", name: "Feed Preheater E-101", position: [2, 0, 18], context: "Preheats the feed close to its bubble point." },

      // Center (column structure on platform)
      { id: "dist-column", type: "column", name: "Distillation Column C-101", position: [0, 0, 0], context: "Tray column with rectifying section above the feed and stripping section below." },
      { id: "dist-condenser", type: "cooler", name: "Overhead Condenser E-102", position: [14, 0, -8], context: "Condenses the overhead vapour using cooling water." },
      { id: "dist-reboiler", type: "heatExchanger", name: "Reboiler E-103", position: [-14, 0, -8], context: "Vaporises part of the bottom liquid using steam to drive the stripping section." },

      // North side (product tanks)
      { id: "dist-distillate-tank", type: "storageTank", name: "Distillate Receiver", position: [18, 0, -18], context: "Receives the light (more volatile) product from the top." },
      { id: "dist-bottoms-tank", type: "storageTank", name: "Bottoms Receiver", position: [-18, 0, -18], context: "Receives the heavy (less volatile) product from the bottom." },
    ],
    pipes: [
      { id: "dist-p1", from: "dist-feed-tank", to: "dist-pump", stream: "feed", routing: "direct" },
      { id: "dist-p2", from: "dist-pump", to: "dist-preheater", stream: "feed", routing: "direct" },
      { id: "dist-p3", from: "dist-preheater", to: "dist-column", stream: "feed", routing: "rack", rackId: "dist-rack1" },
      { id: "dist-p4", from: "dist-column", to: "dist-condenser", stream: "product", routing: "rack", rackId: "dist-rack1" },
      { id: "dist-p5", from: "dist-condenser", to: "dist-distillate-tank", stream: "product", routing: "direct" },
      { id: "dist-p6", from: "dist-column", to: "dist-reboiler", stream: "intermediate", routing: "direct" },
      { id: "dist-p7", from: "dist-reboiler", to: "dist-bottoms-tank", stream: "product", routing: "direct" },
    ],
    areas: [
      { id: "dist-area-a", name: "Feed Prep", kind: "process", footprint: { x: -10, z: 18, width: 30, depth: 12 }, equipmentIds: ["dist-feed-tank", "dist-pump", "dist-preheater"] },
      { id: "dist-area-b", name: "Column Structure", kind: "process", footprint: { x: 0, z: -4, width: 30, depth: 16 }, equipmentIds: ["dist-column", "dist-condenser", "dist-reboiler"] },
      { id: "dist-area-c", name: "Product Tank Farm", kind: "storage", footprint: { x: 0, z: -18, width: 40, depth: 12 }, bunded: true, equipmentIds: ["dist-distillate-tank", "dist-bottoms-tank"] },
    ],
    racks: [
      { id: "dist-rack1", from: { x: 0, z: 18 }, to: { x: 0, z: -8 }, height: 7, levels: 2 },
    ],
    structures: [
      { id: "dist-platform1", kind: "platform", position: [0, 0, 0], size: [6, 5, 6] },
      { id: "dist-stairway1", kind: "stairway", position: [8, 0, 6], rotation: Math.PI, height: 5 },
    ],
    processOverview:
      "Feed is pumped from the tank, preheated near its bubble point, and fed to the middle of the column. Vapour rising from the reboiler enriches in the light component. The overhead vapour is condensed — part returned as reflux, part taken as distillate. The bottom liquid is vaporised in the reboiler and the remainder withdrawn as bottoms product.",
    processSteps: [
      { order: 1, title: "Feed storage", description: "The feed tank holds the mixture to be separated.", equipmentId: "dist-feed-tank" },
      { order: 2, title: "Pumping", description: "The feed pump moves the liquid through the preheater.", equipmentId: "dist-pump" },
      { order: 3, title: "Preheat", description: "The preheater warms the feed close to its bubble point.", equipmentId: "dist-preheater" },
      { order: 4, title: "Separation", description: "Counter-current vapour-liquid contact enriches the light component at the top.", equipmentId: "dist-column" },
      { order: 5, title: "Condensation", description: "The overhead vapour is condensed; part returns as reflux.", equipmentId: "dist-condenser" },
      { order: 6, title: "Reboiling", description: "The reboiler vaporises part of the bottom liquid.", equipmentId: "dist-reboiler" },
      { order: 7, title: "Product collection", description: "Distillate and bottoms are collected in their receivers.", equipmentId: "dist-distillate-tank" },
    ],
  },

  // ─────────────────────────── SULFURIC ACID ───────────────────────────
  {
    id: "sulfuric-acid",
    name: "Sulfuric Acid Plant (Contact Process)",
    tagline: "S → SO₂ → SO₃ → H₂SO₄ via the contact process",
    description:
      "A double-absorption contact-process sulfuric acid plant: sulfur is burned to SO₂, catalytically oxidised to SO₃ over vanadium, and absorbed in concentrated sulfuric acid.",
    keywords: ["sulfuric", "sulphuric", "sulfur", "sulphur", "h2so4", "contact process", "acid"],
    difficulty: "Intermediate",
    estimatedTime: 18,
    equipment: [
      // West side
      { id: "h2so4-sulfur-tank", type: "storageTank", name: "Sulfur Storage", position: [-22, 0, -12], context: "Molten elemental sulfur stored heated, ready to be burned." },
      { id: "h2so4-burner", type: "heater", name: "Sulfur Burner B-101", position: [-22, 0, 0], context: "Burns molten sulfur with dry air to produce SO₂." },
      { id: "h2so4-compressor", type: "compressor", name: "Air Blower K-101", position: [-22, 0, 12], context: "Forces dried combustion air through the burner and train." },

      // Center
      { id: "h2so4-converter", type: "reactor", name: "SO₂ Converter R-101", position: [0, 0, -6], context: "Multi-bed catalytic converter with vanadium pentoxide. Exothermic: 2 SO₂ + O₂ → 2 SO₃." },
      { id: "h2so4-economiser", type: "heatExchanger", name: "Gas Economiser E-101", position: [0, 0, 6], context: "Recovers heat from the converter effluent to preheat incoming gas." },

      // East side
      { id: "h2so4-absorber", type: "column", name: "Absorption Tower C-101", position: [22, 0, -6], context: "Packed tower where concentrated sulfuric acid absorbs SO₃." },
      { id: "h2so4-cooler", type: "cooler", name: "Acid Cooler E-102", position: [22, 0, 6], context: "Removes heat of absorption from the circulating acid." },
      { id: "h2so4-product", type: "storageTank", name: "Product Acid Storage", position: [22, 0, 18], context: "Stores finished 98% sulfuric acid ready for dispatch." },
    ],
    pipes: [
      { id: "h2so4-p1", from: "h2so4-sulfur-tank", to: "h2so4-burner", stream: "feed", routing: "direct" },
      { id: "h2so4-p2", from: "h2so4-compressor", to: "h2so4-burner", stream: "utility-cold", routing: "direct" },
      { id: "h2so4-p3", from: "h2so4-burner", to: "h2so4-converter", stream: "intermediate", routing: "rack", rackId: "h2so4-rack1" },
      { id: "h2so4-p4", from: "h2so4-converter", to: "h2so4-economiser", stream: "intermediate", routing: "direct" },
      { id: "h2so4-p5", from: "h2so4-economiser", to: "h2so4-absorber", stream: "intermediate", routing: "rack", rackId: "h2so4-rack1" },
      { id: "h2so4-p6", from: "h2so4-absorber", to: "h2so4-cooler", stream: "product", routing: "direct" },
      { id: "h2so4-p7", from: "h2so4-cooler", to: "h2so4-product", stream: "product", routing: "direct" },
    ],
    areas: [
      { id: "h2so4-area-a", name: "Sulfur Handling", kind: "process", footprint: { x: -22, z: 0, width: 16, depth: 30 }, bunded: true, equipmentIds: ["h2so4-sulfur-tank", "h2so4-burner", "h2so4-compressor"] },
      { id: "h2so4-area-b", name: "Converter", kind: "process", footprint: { x: 0, z: 0, width: 14, depth: 16 }, equipmentIds: ["h2so4-converter", "h2so4-economiser"] },
      { id: "h2so4-area-c", name: "Absorption & Storage", kind: "storage", footprint: { x: 22, z: 6, width: 16, depth: 30 }, bunded: true, equipmentIds: ["h2so4-absorber", "h2so4-cooler", "h2so4-product"] },
    ],
    racks: [
      { id: "h2so4-rack1", from: { x: -22, z: 0 }, to: { x: 22, z: 0 }, height: 7, levels: 2 },
    ],
    structures: [
      { id: "h2so4-platform1", kind: "platform", position: [0, 0, -6], size: [5, 6, 5] },
      { id: "h2so4-stairway1", kind: "stairway", position: [8, 0, 2], rotation: Math.PI, height: 6 },
    ],
    processOverview:
      "Molten sulfur is burned with dried air to form SO₂. The gas is passed over a vanadium catalyst in a multi-bed converter where SO₂ is oxidised to SO₃; heat is recovered between beds. The SO₃ is absorbed into concentrated sulfuric acid in a packed tower, forming oleum that is diluted to 98% product acid.",
    processSteps: [
      { order: 1, title: "Sulfur storage", description: "Molten elemental sulfur is kept hot and ready to burn.", equipmentId: "h2so4-sulfur-tank" },
      { order: 2, title: "Combustion", description: "The sulfur burner combusts sulfur with dried air to produce SO₂.", equipmentId: "h2so4-burner" },
      { order: 3, title: "Air supply", description: "The air blower pushes dried air through the burner.", equipmentId: "h2so4-compressor" },
      { order: 4, title: "Catalytic oxidation", description: "SO₂ is oxidised to SO₃ over vanadium catalyst.", equipmentId: "h2so4-converter" },
      { order: 5, title: "Heat recovery", description: "The economiser recovers converter effluent heat.", equipmentId: "h2so4-economiser" },
      { order: 6, title: "Absorption", description: "SO₃ is absorbed into concentrated sulfuric acid.", equipmentId: "h2so4-absorber" },
      { order: 7, title: "Cooling", description: "The acid cooler removes heat of absorption.", equipmentId: "h2so4-cooler" },
      { order: 8, title: "Storage", description: "Finished 98% sulfuric acid is stored before dispatch.", equipmentId: "h2so4-product" },
    ],
  },

  // ─────────────────────────── ETHANOL ───────────────────────────
  {
    id: "ethanol",
    name: "Bio-Ethanol Plant (Fermentation + Distillation)",
    tagline: "Sugar → ethanol + CO₂ by yeast, then purified by distillation",
    description:
      "A fermentation-based ethanol plant: a sugar feed tank, a fermenter, a beer column to strip ethanol, and a rectifier column to reach azeotropic purity, with a cooler and product storage.",
    keywords: ["ethanol", "alcohol", "fermentation", "bioethanol", "yeast", "beer"],
    difficulty: "Beginner",
    estimatedTime: 14,
    equipment: [
      // North side
      { id: "etoh-feed-tank", type: "tank", name: "Sugar Feed Tank", position: [-22, 0, -18], context: "Holds the sugar solution (molasses or glucose) diluted to fermentation strength." },
      { id: "etoh-pump", type: "pump", name: "Feed Pump P-101", position: [-10, 0, -18], context: "Pumps the sugar feed into the fermenter." },
      { id: "etoh-fermenter", type: "reactor", name: "Fermenter R-101", position: [-22, 0, -6], context: "Stirred batch fermenter. Yeast converts glucose to ethanol and CO₂ at ~32 °C." },

      // Center (distillation train)
      { id: "etoh-beer-column", type: "column", name: "Beer Column C-101", position: [0, 0, -6], context: "Strips ethanol from the fermentation broth." },
      { id: "etoh-rectifier", type: "column", name: "Rectifier Column C-102", position: [12, 0, 6], context: "Concentrates the dilute ethanol up to the azeotropic ~95.6% limit." },
      { id: "etoh-condenser", type: "cooler", name: "Rectifier Condenser E-101", position: [22, 0, -6], context: "Condenses the rectifier overhead using cooling water." },
      { id: "etoh-cooler", type: "cooler", name: "Product Cooler E-102", position: [22, 0, 6], context: "Cools the finished ethanol to ambient temperature." },

      // South (storage)
      { id: "etoh-storage", type: "storageTank", name: "Ethanol Product Storage", position: [0, 0, 18], context: "Stores finished ethanol awaiting quality check and dispatch." },
    ],
    pipes: [
      { id: "etoh-p1", from: "etoh-feed-tank", to: "etoh-pump", stream: "feed", routing: "direct" },
      { id: "etoh-p2", from: "etoh-pump", to: "etoh-fermenter", stream: "feed", routing: "direct" },
      { id: "etoh-p3", from: "etoh-fermenter", to: "etoh-beer-column", stream: "intermediate", routing: "rack", rackId: "etoh-rack1" },
      { id: "etoh-p4", from: "etoh-beer-column", to: "etoh-rectifier", stream: "intermediate", routing: "rack", rackId: "etoh-rack1" },
      { id: "etoh-p5", from: "etoh-rectifier", to: "etoh-condenser", stream: "product", routing: "rack", rackId: "etoh-rack1" },
      { id: "etoh-p6", from: "etoh-condenser", to: "etoh-cooler", stream: "product", routing: "direct" },
      { id: "etoh-p7", from: "etoh-cooler", to: "etoh-storage", stream: "product", routing: "rack", rackId: "etoh-rack1" },
    ],
    areas: [
      { id: "etoh-area-a", name: "Fermentation", kind: "process", footprint: { x: -16, z: -12, width: 28, depth: 18 }, equipmentIds: ["etoh-feed-tank", "etoh-pump", "etoh-fermenter"] },
      { id: "etoh-area-b", name: "Distillation Train", kind: "process", footprint: { x: 8, z: 0, width: 30, depth: 20 }, equipmentIds: ["etoh-beer-column", "etoh-rectifier", "etoh-condenser", "etoh-cooler"] },
      { id: "etoh-area-c", name: "Product Storage", kind: "storage", footprint: { x: 0, z: 18, width: 16, depth: 12 }, bunded: true, equipmentIds: ["etoh-storage"] },
    ],
    racks: [
      { id: "etoh-rack1", from: { x: -22, z: 0 }, to: { x: 22, z: 0 }, height: 7, levels: 2 },
    ],
    structures: [
      { id: "etoh-platform1", kind: "platform", position: [6, 0, 0], size: [8, 5, 8] },
      { id: "etoh-stairway1", kind: "stairway", position: [14, 0, 10], rotation: Math.PI, height: 5 },
    ],
    processOverview:
      "Sugar solution is pumped into a stirred fermenter where yeast anaerobically converts glucose to ethanol and CO₂. The resulting dilute 'beer' is fed to the beer column, which strips the ethanol overhead. The dilute ethanol is then concentrated in the rectifier column up to the azeotropic limit, condensed, cooled, and sent to storage.",
    processSteps: [
      { order: 1, title: "Feed storage", description: "The sugar feed tank holds the diluted molasses or glucose solution.", equipmentId: "etoh-feed-tank" },
      { order: 2, title: "Pumping", description: "The feed pump moves the sugar solution into the fermenter.", equipmentId: "etoh-pump" },
      { order: 3, title: "Fermentation", description: "Yeast converts glucose to ethanol and CO₂ at ~32 °C.", equipmentId: "etoh-fermenter" },
      { order: 4, title: "Beer stripping", description: "The beer column strips ethanol from the fermentation broth.", equipmentId: "etoh-beer-column" },
      { order: 5, title: "Rectification", description: "The rectifier concentrates the ethanol to the azeotropic limit.", equipmentId: "etoh-rectifier" },
      { order: 6, title: "Condensation", description: "The rectifier overhead is condensed; reflux returns.", equipmentId: "etoh-condenser" },
      { order: 7, title: "Cooling", description: "The product cooler brings the ethanol to ambient temperature.", equipmentId: "etoh-cooler" },
      { order: 8, title: "Storage", description: "Finished ethanol is sent to product storage.", equipmentId: "etoh-storage" },
    ],
  },
];

export function findPlantByCommand(command: string): {
  template: PlantTemplate;
  score: number;
} | null {
  const text = command.toLowerCase();
  let best: { template: PlantTemplate; score: number } | null = null;
  for (const template of PLANT_TEMPLATES) {
    let score = 0;
    for (const kw of template.keywords) {
      if (text.includes(kw)) score += kw.length > 4 ? 2 : 1;
    }
    if (text.includes(template.name.toLowerCase().split(" ")[0])) score += 3;
    if (score > 0 && (!best || score > best.score)) best = { template, score };
  }
  return best;
}

export function getPlantById(id: string): PlantTemplate | undefined {
  return PLANT_TEMPLATES.find((p) => p.id === id);
}
