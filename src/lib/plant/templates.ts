import type { PlantTemplate } from "./types";

/**
 * Pre-built plant templates with REAL-WORLD 2D footprints.
 *
 * Real chemical plants are NOT laid out in a straight line. Equipment is
 * clustered by process area, connected by pipe racks that run in multiple
 * directions. The layout considers:
 *  - Process flow (feed → reaction → separation → storage)
 *  - Maintenance access (space around each vessel)
 *  - Safety (spacing between hot reactors and storage)
 *  - Pipe routing (short, logical runs)
 *
 * Coordinates use X (east-west) and Z (north-south) on the ground plane,
 * Y up. Equipment is spread across BOTH axes to create a realistic
 * plant footprint that the student can walk around — not a single line.
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
    equipment: [
      {
        id: "nh3-feed-tank",
        type: "tank",
        name: "Feed Tank (H₂ + N₂ mix)",
        position: [-11, 0, 8],
        context: "Holds the stoichiometric synthesis-gas mixture (3 H₂ : 1 N₂) before compression.",
      },
      {
        id: "nh3-compressor",
        type: "compressor",
        name: "Syngas Compressor K-101",
        position: [-7, 0, 4],
        context: "Raises the synthesis gas from near-atmospheric to roughly 150 bar.",
      },
      {
        id: "nh3-feedheater",
        type: "heatExchanger",
        name: "Feed/Effluent Exchanger E-101",
        position: [-2, 0, -1],
        context: "Recovers heat from the hot reactor effluent to preheat the cold feed — classic energy integration.",
      },
      {
        id: "nh3-reactor",
        type: "reactor",
        name: "Ammonia Converter R-101",
        position: [3, 0, -5],
        context: "Fixed-bed catalytic reactor with iron catalyst. Exothermic: N₂ + 3 H₂ ⇌ 2 NH₃. Per-pass conversion ~15–25%.",
      },
      {
        id: "nh3-cooler",
        type: "cooler",
        name: "Ammonia Condenser E-102",
        position: [8, 0, -2],
        context: "Cools the reactor effluent so ammonia condenses while unreacted N₂/H₂ stays gaseous.",
      },
      {
        id: "nh3-separator",
        type: "separator",
        name: "Ammonia Separator V-101",
        position: [10, 0, 4],
        context: "Splits liquid ammonia (bottom) from unreacted recycle gas (top).",
      },
      {
        id: "nh3-storage",
        type: "storageTank",
        name: "Ammonia Storage Tank",
        position: [6, 0, 10],
        context: "Refrigerated atmospheric tank storing liquid ammonia before dispatch.",
      },
    ],
    pipes: [
      { id: "nh3-p1", from: "nh3-feed-tank", to: "nh3-compressor", stream: "feed", label: "Syngas" },
      { id: "nh3-p2", from: "nh3-compressor", to: "nh3-feedheater", stream: "intermediate", label: "150 bar" },
      { id: "nh3-p3", from: "nh3-feedheater", to: "nh3-reactor", stream: "intermediate", label: "Preheated" },
      { id: "nh3-p4", from: "nh3-reactor", to: "nh3-feedheater", stream: "product", label: "Hot effluent" },
      { id: "nh3-p5", from: "nh3-feedheater", to: "nh3-cooler", stream: "product", label: "Cooled" },
      { id: "nh3-p6", from: "nh3-cooler", to: "nh3-separator", stream: "product", label: "Two-phase" },
      { id: "nh3-p7", from: "nh3-separator", to: "nh3-storage", stream: "product", label: "Liquid NH₃" },
    ],
    processOverview:
      "Nitrogen and hydrogen are compressed to ~150 bar, preheated by exchange with the hot reactor effluent, and passed over an iron catalyst in the converter. Only a fraction converts per pass, so the unreacted gas is recycled. The effluent is cooled so ammonia condenses; the liquid is separated and stored, and the gas is recycled to the compressor.",
    processSteps: [
      { order: 1, title: "Feed storage", description: "The stoichiometric 3:1 H₂/N₂ synthesis gas is held in the feed tank, ready to enter the loop.", equipmentId: "nh3-feed-tank" },
      { order: 2, title: "Compression", description: "The syngas compressor raises the gas to the ~150 bar the converter needs.", equipmentId: "nh3-compressor" },
      { order: 3, title: "Feed preheat", description: "The cold high-pressure feed recovers heat from the hot reactor effluent in the feed/effluent exchanger.", equipmentId: "nh3-feedheater" },
      { order: 4, title: "Reaction", description: "In the converter, N₂ and H₂ combine exothermically over iron catalyst to form ammonia.", equipmentId: "nh3-reactor" },
      { order: 5, title: "Cooling", description: "The effluent is cooled further in the condenser so that the ammonia liquefies.", equipmentId: "nh3-cooler" },
      { order: 6, title: "Separation", description: "The separator splits the two-phase stream: liquid ammonia drops to the bottom, recycle gas rises to the top.", equipmentId: "nh3-separator" },
      { order: 7, title: "Storage", description: "Liquid ammonia is sent to the refrigerated storage tank to await dispatch.", equipmentId: "nh3-storage" },
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
    equipment: [
      {
        id: "dist-feed-tank",
        type: "tank",
        name: "Feed Tank",
        position: [-10, 0, -7],
        context: "Holds the binary feed mixture (e.g. methanol/water) at ambient temperature.",
      },
      {
        id: "dist-pump",
        type: "pump",
        name: "Feed Pump P-101",
        position: [-6, 0, -4],
        context: "Pumps the feed through the preheater and into the column at the feed tray.",
      },
      {
        id: "dist-preheater",
        type: "heatExchanger",
        name: "Feed Preheater E-101",
        position: [-2, 0, -1],
        context: "Preheats the feed close to its bubble point so it enters the column thermally matched.",
      },
      {
        id: "dist-column",
        type: "column",
        name: "Distillation Column C-101",
        position: [3, 0, 2],
        context: "Tray column with rectifying section above the feed and stripping section below.",
      },
      {
        id: "dist-condenser",
        type: "cooler",
        name: "Overhead Condenser E-102",
        position: [8, 0, -2],
        context: "Condenses the overhead vapour using cooling water. Part returned as reflux, part as distillate.",
      },
      {
        id: "dist-reboiler",
        type: "heatExchanger",
        name: "Reboiler E-103",
        position: [3, 0, 7],
        context: "Vaporises part of the bottom liquid using steam to drive the stripping section.",
      },
      {
        id: "dist-distillate-tank",
        type: "storageTank",
        name: "Distillate Receiver",
        position: [9, 0, 5],
        context: "Receives the light (more volatile) product from the top of the column.",
      },
      {
        id: "dist-bottoms-tank",
        type: "storageTank",
        name: "Bottoms Receiver",
        position: [-1, 0, 9],
        context: "Receives the heavy (less volatile) product from the bottom of the column.",
      },
    ],
    pipes: [
      { id: "dist-p1", from: "dist-feed-tank", to: "dist-pump", stream: "feed", label: "Feed" },
      { id: "dist-p2", from: "dist-pump", to: "dist-preheater", stream: "feed", label: "Pressurised" },
      { id: "dist-p3", from: "dist-preheater", to: "dist-column", stream: "feed", label: "Hot feed" },
      { id: "dist-p4", from: "dist-column", to: "dist-condenser", stream: "product", label: "Overhead vapour" },
      { id: "dist-p5", from: "dist-condenser", to: "dist-distillate-tank", stream: "product", label: "Distillate" },
      { id: "dist-p6", from: "dist-column", to: "dist-reboiler", stream: "intermediate", label: "Bottoms liquid" },
      { id: "dist-p7", from: "dist-reboiler", to: "dist-bottoms-tank", stream: "product", label: "Bottoms" },
    ],
    processOverview:
      "Feed is pumped from the tank, preheated near its bubble point, and fed to the middle of the column. Vapour rising from the reboiler enriches in the light component as it contacts liquid descending from the condenser. The overhead vapour is condensed — part returned as reflux, part taken as distillate. The bottom liquid is vaporised in the reboiler and the remainder withdrawn as bottoms product.",
    processSteps: [
      { order: 1, title: "Feed storage", description: "The feed tank holds the mixture to be separated.", equipmentId: "dist-feed-tank" },
      { order: 2, title: "Pumping", description: "The feed pump moves the liquid through the preheater and into the column.", equipmentId: "dist-pump" },
      { order: 3, title: "Preheat", description: "The preheater warms the feed close to its bubble point.", equipmentId: "dist-preheater" },
      { order: 4, title: "Separation", description: "Inside the column, counter-current vapour-liquid contact enriches the light component at the top and the heavy at the bottom.", equipmentId: "dist-column" },
      { order: 5, title: "Condensation", description: "The overhead vapour is condensed; part returns as reflux, the rest is distillate product.", equipmentId: "dist-condenser" },
      { order: 6, title: "Reboiling", description: "The reboiler vaporises part of the bottom liquid to drive the stripping section.", equipmentId: "dist-reboiler" },
      { order: 7, title: "Product collection", description: "Distillate and bottoms are collected in their respective receivers.", equipmentId: "dist-distillate-tank" },
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
    equipment: [
      {
        id: "h2so4-sulfur-tank",
        type: "storageTank",
        name: "Sulfur Storage",
        position: [-12, 0, -6],
        context: "Molten elemental sulfur stored heated, ready to be burned.",
      },
      {
        id: "h2so4-burner",
        type: "heater",
        name: "Sulfur Burner B-101",
        position: [-7, 0, -2],
        context: "Burns molten sulfur with dry air to produce SO₂ gas: S + O₂ → SO₂.",
      },
      {
        id: "h2so4-compressor",
        type: "compressor",
        name: "Air Blower K-101",
        position: [-9, 0, 3],
        context: "Forces dried combustion air through the burner and the rest of the train.",
      },
      {
        id: "h2so4-converter",
        type: "reactor",
        name: "SO₂ Converter R-101",
        position: [-1, 0, 1],
        context: "Multi-bed catalytic converter with vanadium pentoxide. Exothermic: 2 SO₂ + O₂ → 2 SO₃.",
      },
      {
        id: "h2so4-economiser",
        type: "heatExchanger",
        name: "Gas Economiser E-101",
        position: [4, 0, -3],
        context: "Recovers heat from the converter effluent to preheat the incoming SO₂ gas.",
      },
      {
        id: "h2so4-absorber",
        type: "column",
        name: "Absorption Tower C-101",
        position: [8, 0, 1],
        context: "Packed tower in which concentrated sulfuric acid absorbs SO₃ to form oleum.",
      },
      {
        id: "h2so4-cooler",
        type: "cooler",
        name: "Acid Cooler E-102",
        position: [6, 0, 7],
        context: "Removes the heat of absorption from the circulating acid stream.",
      },
      {
        id: "h2so4-product",
        type: "storageTank",
        name: "Product Acid Storage",
        position: [11, 0, 6],
        context: "Stores the finished 98% sulfuric acid ready for dispatch.",
      },
    ],
    pipes: [
      { id: "h2so4-p1", from: "h2so4-sulfur-tank", to: "h2so4-burner", stream: "feed", label: "Molten S" },
      { id: "h2so4-p2", from: "h2so4-compressor", to: "h2so4-burner", stream: "utility-cold", label: "Dry air" },
      { id: "h2so4-p3", from: "h2so4-burner", to: "h2so4-converter", stream: "intermediate", label: "SO₂ gas" },
      { id: "h2so4-p4", from: "h2so4-converter", to: "h2so4-economiser", stream: "intermediate", label: "SO₃ gas" },
      { id: "h2so4-p5", from: "h2so4-economiser", to: "h2so4-absorber", stream: "intermediate", label: "Cooled SO₃" },
      { id: "h2so4-p6", from: "h2so4-absorber", to: "h2so4-cooler", stream: "product", label: "Hot acid" },
      { id: "h2so4-p7", from: "h2so4-cooler", to: "h2so4-product", stream: "product", label: "98% H₂SO₄" },
    ],
    processOverview:
      "Molten sulfur is burned with dried air to form SO₂. The gas is passed over a vanadium catalyst in a multi-bed converter where SO₂ is oxidised to SO₃; heat is recovered between beds. The SO₃ is absorbed into concentrated sulfuric acid in a packed tower, forming oleum that is diluted to 98% product acid. The hot acid is cooled and sent to storage.",
    processSteps: [
      { order: 1, title: "Sulfur storage", description: "Molten elemental sulfur is kept hot and ready to burn.", equipmentId: "h2so4-sulfur-tank" },
      { order: 2, title: "Combustion", description: "The sulfur burner combusts sulfur with dried air to produce SO₂.", equipmentId: "h2so4-burner" },
      { order: 3, title: "Air supply", description: "The air blower pushes dried air through the burner and downstream beds.", equipmentId: "h2so4-compressor" },
      { order: 4, title: "Catalytic oxidation", description: "In the converter, SO₂ is oxidised to SO₃ over vanadium catalyst across several beds with inter-cooling.", equipmentId: "h2so4-converter" },
      { order: 5, title: "Heat recovery", description: "The economiser recovers converter effluent heat to preheat the incoming gas.", equipmentId: "h2so4-economiser" },
      { order: 6, title: "Absorption", description: "SO₃ is absorbed into concentrated sulfuric acid in the packed absorption tower.", equipmentId: "h2so4-absorber" },
      { order: 7, title: "Cooling", description: "The acid cooler removes the heat of absorption from the circulating acid.", equipmentId: "h2so4-cooler" },
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
    equipment: [
      {
        id: "etoh-feed-tank",
        type: "tank",
        name: "Sugar Feed Tank",
        position: [-11, 0, 6],
        context: "Holds the sugar solution (molasses or glucose) diluted to fermentation strength.",
      },
      {
        id: "etoh-pump",
        type: "pump",
        name: "Feed Pump P-101",
        position: [-7, 0, 3],
        context: "Pumps the sugar feed into the fermenter.",
      },
      {
        id: "etoh-fermenter",
        type: "reactor",
        name: "Fermenter R-101",
        position: [-2, 0, 6],
        context: "Stirred batch fermenter. Yeast converts glucose to ethanol and CO₂ at ~32 °C.",
      },
      {
        id: "etoh-beer-column",
        type: "column",
        name: "Beer Column C-101",
        position: [3, 0, 2],
        context: "Strips ethanol from the fermentation broth, producing a dilute ethanol overhead.",
      },
      {
        id: "etoh-rectifier",
        type: "column",
        name: "Rectifier Column C-102",
        position: [7, 0, -2],
        context: "Concentrates the dilute ethanol up to the azeotropic ~95.6% limit.",
      },
      {
        id: "etoh-condenser",
        type: "cooler",
        name: "Rectifier Condenser E-101",
        position: [9, 0, 4],
        context: "Condenses the rectifier overhead using cooling water; reflux returns to the column.",
      },
      {
        id: "etoh-cooler",
        type: "cooler",
        name: "Product Cooler E-102",
        position: [5, 0, -6],
        context: "Cools the finished ethanol to ambient temperature before storage.",
      },
      {
        id: "etoh-storage",
        type: "storageTank",
        name: "Ethanol Product Storage",
        position: [0, 0, -8],
        context: "Stores the finished ethanol awaiting quality check and dispatch.",
      },
    ],
    pipes: [
      { id: "etoh-p1", from: "etoh-feed-tank", to: "etoh-pump", stream: "feed", label: "Sugar feed" },
      { id: "etoh-p2", from: "etoh-pump", to: "etoh-fermenter", stream: "feed", label: "To fermenter" },
      { id: "etoh-p3", from: "etoh-fermenter", to: "etoh-beer-column", stream: "intermediate", label: "Beer" },
      { id: "etoh-p4", from: "etoh-beer-column", to: "etoh-rectifier", stream: "intermediate", label: "Dilute ethanol" },
      { id: "etoh-p5", from: "etoh-rectifier", to: "etoh-condenser", stream: "product", label: "Overhead vapour" },
      { id: "etoh-p6", from: "etoh-condenser", to: "etoh-cooler", stream: "product", label: "Condensed ethanol" },
      { id: "etoh-p7", from: "etoh-cooler", to: "etoh-storage", stream: "product", label: "95% ethanol" },
    ],
    processOverview:
      "Sugar solution is pumped into a stirred fermenter where yeast anaerobically converts glucose to ethanol and CO₂. The resulting dilute 'beer' is fed to the beer column, which strips the ethanol overhead. The dilute ethanol is then concentrated in the rectifier column up to the azeotropic limit, condensed, cooled, and sent to storage.",
    processSteps: [
      { order: 1, title: "Feed storage", description: "The sugar feed tank holds the diluted molasses or glucose solution.", equipmentId: "etoh-feed-tank" },
      { order: 2, title: "Pumping", description: "The feed pump moves the sugar solution into the fermenter.", equipmentId: "etoh-pump" },
      { order: 3, title: "Fermentation", description: "Yeast converts glucose to ethanol and CO₂ in the stirred fermenter at ~32 °C.", equipmentId: "etoh-fermenter" },
      { order: 4, title: "Beer stripping", description: "The beer column strips ethanol from the fermentation broth.", equipmentId: "etoh-beer-column" },
      { order: 5, title: "Rectification", description: "The rectifier concentrates the ethanol to the azeotropic limit.", equipmentId: "etoh-rectifier" },
      { order: 6, title: "Condensation", description: "The rectifier overhead is condensed; reflux returns, product is withdrawn.", equipmentId: "etoh-condenser" },
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
