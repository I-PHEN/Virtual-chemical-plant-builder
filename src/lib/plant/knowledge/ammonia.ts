import type { PlantKnowledgeTemplate } from "./types";

/**
 * Ammonia Plant (Haber–Bosch) — full knowledge template.
 *
 * This is the engineering truth of a real-world ammonia plant, organized as
 * 9 process stages with 25+ major equipment pieces. The layout engine takes
 * this and computes the (x, y, z) plot plan. The AI takes this and narrates it.
 *
 * Equipment count matches real-world references (typical ammonia plant has
 * 25-40 major equipment pieces depending on integration level).
 *
 * Stages are ordered by process flow:
 *   feed_prep → reforming → co_conversion → co2_removal → purification →
 *   synthesis_gas_prep → synthesis → refrigeration → storage_utility
 */
export const AMMONIA_KNOWLEDGE: PlantKnowledgeTemplate = {
  id: "ammonia",
  name: "Ammonia Plant (Haber–Bosch)",
  tagline: "N₂ + 3 H₂ → 2 NH₃ — natural gas to fertilizer via steam reforming",
  description:
    "A natural-gas-based Haber–Bosch ammonia plant. Methane is reformed with steam and air to produce synthesis gas (H₂ + N₂ + CO), CO is shifted to CO₂ and removed, residual carbon oxides are methanated, the purified syngas is compressed to ~150 bar and reacted over iron catalyst, and the ammonia product is condensed, separated, refrigerated, and stored.",
  keywords: [
    "ammonia",
    "haber",
    "bosch",
    "nh3",
    "synthesis gas",
    "syngas",
    "fertiliser",
    "fertilizer",
    "urea feedstock",
  ],
  difficulty: "Advanced",
  estimatedTime: 25,
  chemicalEquation: "N₂ + 3 H₂ → 2 NH₃  (ΔH = −46 kJ/mol, exothermic)",
  capacity: "1000–2000 metric tons per day (single train)",

  stages: [
    // ─────────────── 1. FEED PREPARATION ───────────────
    {
      id: "feed_prep",
      name: "Feed Preparation",
      description:
        "Natural gas is compressed, heated, and desulfurized to protect downstream nickel catalysts from poisoning.",
      areaKind: "process",
      equipment: [
        {
          id: "ng_compressor",
          type: "compressor",
          name: "Natural Gas Compressor",
          tag: "K-101",
          role: "Raises incoming natural gas pressure to reforming conditions.",
          sizeClass: "medium",
          essential: true,
          assetTags: ["ammonia", "compression", "natural-gas"],
        },
        {
          id: "feed_heater",
          type: "heater",
          name: "Feed Gas Heater",
          tag: "E-101",
          role: "Preheats the natural gas to ~350–400 °C before desulfurization.",
          sizeClass: "small",
          essential: true,
        },
        {
          id: "desulfurizer",
          type: "desulfurizer",
          name: "Desulfurizer Vessel",
          tag: "V-101",
          role: "Removes sulfur compounds (H₂S, mercaptans) over ZnO / CoMo catalyst beds.",
          sizeClass: "medium",
          essential: true,
          assetTags: ["ammonia", "catalyst", "vessel"],
        },
      ],
    },

    // ─────────────── 2. REFORMING ───────────────
    {
      id: "reforming",
      name: "Reforming Section",
      description:
        "The heart of the plant. Methane reacts with steam in the primary reformer, then with air (which supplies the nitrogen) in the secondary reformer, producing syngas.",
      areaKind: "process",
      equipment: [
        {
          id: "primary_reformer",
          type: "reformer",
          name: "Primary Reformer",
          tag: "R-101",
          role: "Catalytic steam-methane reformer in fired tubes. CH₄ + H₂O → CO + 3 H₂.",
          sizeClass: "huge",
          essential: true,
          assetTags: ["ammonia", "reformer", "fired", "catalytic"],
        },
        {
          id: "secondary_reformer",
          type: "reformer",
          name: "Secondary Reformer",
          tag: "R-102",
          role: "Air is injected; partial combustion + catalytic reforming supplies the nitrogen for ammonia.",
          sizeClass: "large",
          essential: true,
          assetTags: ["ammonia", "reformer", "air", "catalytic"],
        },
        {
          id: "whb_1",
          type: "heatExchanger",
          name: "Waste Heat Boiler 1",
          tag: "E-102",
          role: "Recovers heat from the secondary reformer effluent to raise high-pressure steam.",
          sizeClass: "medium",
          essential: true,
        },
        {
          id: "steam_drum",
          type: "steamDrum",
          name: "High-Pressure Steam Drum",
          tag: "V-102",
          role: "Separates steam from water in the HP steam generation circuit.",
          sizeClass: "medium",
          essential: true,
        },
      ],
    },

    // ─────────────── 3. CO CONVERSION (SHIFT) ───────────────
    {
      id: "co_conversion",
      name: "CO Conversion (Shift)",
      description:
        "Carbon monoxide is shifted to CO₂ over two catalyst beds, producing additional hydrogen.",
      areaKind: "process",
      equipment: [
        {
          id: "ht_shift",
          type: "reactor",
          name: "High-Temperature Shift Reactor",
          tag: "R-103",
          role: "Iron-chrome catalyst, ~400 °C. CO + H₂O → CO₂ + H₂.",
          sizeClass: "large",
          essential: true,
          assetTags: ["ammonia", "shift", "reactor"],
        },
        {
          id: "lt_shift",
          type: "reactor",
          name: "Low-Temperature Shift Reactor",
          tag: "R-104",
          role: "Copper catalyst, ~220 °C. Pushes CO conversion further toward equilibrium.",
          sizeClass: "large",
          essential: true,
          assetTags: ["ammonia", "shift", "reactor"],
        },
      ],
    },

    // ─────────────── 4. CO₂ REMOVAL ───────────────
    {
      id: "co2_removal",
      name: "CO₂ Removal",
      description:
        "CO₂ is absorbed into a solvent (amine or potassium carbonate) and stripped out for disposal or use.",
      areaKind: "process",
      equipment: [
        {
          id: "co2_absorber",
          type: "column",
          name: "CO₂ Absorber",
          tag: "C-101",
          role: "Tall packed column where lean solvent absorbs CO₂ from the syngas.",
          sizeClass: "huge",
          essential: true,
          assetTags: ["ammonia", "absorber", "column", "tall"],
        },
        {
          id: "co2_stripper",
          type: "column",
          name: "CO₂ Stripper",
          tag: "C-102",
          role: "Reboiled column that regenerates the rich solvent, releasing CO₂ overhead.",
          sizeClass: "large",
          essential: true,
          assetTags: ["ammonia", "stripper", "column"],
        },
        {
          id: "lean_rich_exchanger",
          type: "heatExchanger",
          name: "Lean/Rich Solvent Exchanger",
          tag: "E-103",
          role: "Recovers heat from hot lean solvent to warm the rich solvent entering the stripper.",
          sizeClass: "medium",
          essential: true,
        },
      ],
    },

    // ─────────────── 5. PURIFICATION (METHANATION) ───────────────
    {
      id: "purification",
      name: "Final Purification",
      description:
        "Residual CO and CO₂ (which poison the synthesis catalyst) are converted to inert methane.",
      areaKind: "process",
      equipment: [
        {
          id: "methanator",
          type: "reactor",
          name: "Methanator",
          tag: "R-105",
          role: "Nickel catalyst converts residual CO + CO₂ to CH₄, protecting the synthesis catalyst.",
          sizeClass: "medium",
          essential: true,
          assetTags: ["ammonia", "methanator", "reactor"],
        },
      ],
    },

    // ─────────────── 6. SYNTHESIS GAS COMPRESSION ───────────────
    {
      id: "syngas_compression",
      name: "Synthesis Gas Compression",
      description:
        "The purified syngas is compressed to the 140–180 bar synthesis pressure in a multi-stage centrifugal machine.",
      areaKind: "process",
      equipment: [
        {
          id: "syngas_compressor",
          type: "compressor",
          name: "Synthesis Gas Compressor",
          tag: "K-102",
          role: "Two- or three-case centrifugal compressor driven by a steam turbine.",
          sizeClass: "large",
          essential: true,
          assetTags: ["ammonia", "compression", "syngas", "high-pressure"],
        },
        {
          id: "air_compressor",
          type: "compressor",
          name: "Process Air Compressor",
          tag: "K-103",
          role: "Supplies compressed combustion air to the secondary reformer.",
          sizeClass: "large",
          essential: true,
          assetTags: ["ammonia", "compression", "air"],
        },
      ],
    },

    // ─────────────── 7. AMMONIA SYNTHESIS ───────────────
    {
      id: "synthesis",
      name: "Ammonia Synthesis",
      description:
        "The compressed syngas is preheated, reacted over an iron catalyst, cooled, and the ammonia is condensed out. Unreacted gas is recycled.",
      areaKind: "process",
      equipment: [
        {
          id: "synthesis_reactor",
          type: "reactor",
          name: "Ammonia Synthesis Converter",
          tag: "R-106",
          role: "Fixed-bed iron catalyst. N₂ + 3 H₂ ⇌ 2 NH₃, exothermic, ~450 °C and ~150 bar.",
          sizeClass: "huge",
          essential: true,
          assetTags: ["ammonia", "synthesis", "reactor", "high-pressure", "catalytic"],
        },
        {
          id: "feed_effluent_exchanger",
          type: "heatExchanger",
          name: "Feed/Effluent Exchanger",
          tag: "E-104",
          role: "Recovers heat from hot reactor effluent to preheat the cold incoming feed.",
          sizeClass: "medium",
          essential: true,
        },
        {
          id: "ammonia_condenser",
          type: "cooler",
          name: "Ammonia Condenser",
          tag: "E-105",
          role: "Cools the reactor effluent so ammonia condenses while unreacted gas stays vapor.",
          sizeClass: "large",
          essential: true,
        },
        {
          id: "ammonia_separator",
          type: "separator",
          name: "Ammonia Separator",
          tag: "V-103",
          role: "Drains liquid ammonia from the loop; recycle gas returns to the compressor suction.",
          sizeClass: "medium",
          essential: true,
          assetTags: ["ammonia", "separator", "vessel"],
        },
      ],
    },

    // ─────────────── 8. REFRIGERATION ───────────────
    {
      id: "refrigeration",
      name: "Ammonia Refrigeration",
      description:
        "A closed ammonia loop provides the sub-ambient cooling needed to condense the product.",
      areaKind: "process",
      equipment: [
        {
          id: "refrig_compressor",
          type: "compressor",
          name: "Refrigeration Compressor",
          tag: "K-104",
          role: "Compresses vaporized ammonia refrigerant for condensation.",
          sizeClass: "large",
          essential: true,
          assetTags: ["ammonia", "compression", "refrigeration"],
        },
        {
          id: "refrig_condenser",
          type: "cooler",
          name: "Refrigeration Condenser",
          tag: "E-106",
          role: "Condenses the compressed ammonia refrigerant against cooling water.",
          sizeClass: "large",
          essential: true,
        },
        {
          id: "refrig_evaporator",
          type: "evaporator",
          name: "Refrigeration Evaporator",
          tag: "E-107",
          role: "Evaporates liquid ammonia to provide sub-ambient cooling for the synthesis loop.",
          sizeClass: "large",
          essential: true,
        },
      ],
    },

    // ─────────────── 9. STORAGE & UTILITIES ───────────────
    {
      id: "storage_utility",
      name: "Storage & Utilities",
      description:
        "Product storage, cooling water, steam generation, and the flare for safe disposal of waste gases.",
      areaKind: "utility",
      equipment: [
        {
          id: "ammonia_storage",
          type: "storageTank",
          name: "Ammonia Storage Tank",
          tag: "T-101",
          role: "Refrigerated atmospheric tank (typically −33 °C) storing liquid ammonia before dispatch.",
          sizeClass: "huge",
          essential: true,
          assetTags: ["ammonia", "storage", "refrigerated"],
        },
        {
          id: "cooling_tower",
          type: "coolingTower",
          name: "Cooling Tower",
          tag: "CT-101",
          role: "Rejects heat from the process cooling water circuit to the atmosphere.",
          sizeClass: "huge",
          essential: true,
          assetTags: ["utility", "cooling", "water"],
        },
        {
          id: "boiler",
          type: "boiler",
          name: "Auxiliary Boiler",
          tag: "B-101",
          role: "Provides supplementary high-pressure steam for compressor drives and process use.",
          sizeClass: "large",
          essential: false,
        },
        {
          id: "flare_stack",
          type: "flareStack",
          name: "Flare Stack",
          tag: "F-101",
          role: "Burns waste and relief gases safely during startup, shutdown, or upsets.",
          sizeClass: "huge",
          essential: true,
          assetTags: ["safety", "flare", "vent", "tall"],
        },
      ],
    },
  ],

  flows: [
    // Feed prep
    { from: "ng_compressor", to: "feed_heater", material: "natural_gas", stream: "feed", primary: true },
    { from: "feed_heater", to: "desulfurizer", material: "hot_natural_gas", stream: "feed", primary: true },
    // Reforming
    { from: "desulfurizer", to: "primary_reformer", material: "desulfurized_gas", stream: "feed", primary: true },
    { from: "primary_reformer", to: "secondary_reformer", material: "reformed_gas", stream: "intermediate", primary: true },
    { from: "air_compressor", to: "secondary_reformer", material: "process_air", stream: "utility-cold", primary: false },
    { from: "secondary_reformer", to: "whb_1", material: "hot_syngas", stream: "intermediate", primary: true },
    { from: "whb_1", to: "steam_drum", material: "hp_steam", stream: "utility-hot", primary: false },
    // CO shift
    { from: "whb_1", to: "ht_shift", material: "cooled_syngas", stream: "intermediate", primary: true },
    { from: "ht_shift", to: "lt_shift", material: "shifted_gas", stream: "intermediate", primary: true },
    // CO2 removal
    { from: "lt_shift", to: "co2_absorber", material: "shifted_gas", stream: "intermediate", primary: true },
    { from: "co2_absorber", to: "co2_stripper", material: "rich_solvent", stream: "intermediate", primary: false },
    { from: "co2_stripper", to: "lean_rich_exchanger", material: "lean_solvent", stream: "utility-hot", primary: false },
    { from: "lean_rich_exchanger", to: "co2_absorber", material: "lean_solvent", stream: "utility-cold", primary: false },
    // Purification
    { from: "co2_absorber", to: "methanator", material: "decarb_gas", stream: "intermediate", primary: true },
    // Compression
    { from: "methanator", to: "syngas_compressor", material: "pure_syngas", stream: "intermediate", primary: true },
    // Synthesis
    { from: "syngas_compressor", to: "feed_effluent_exchanger", material: "compressed_syngas", stream: "intermediate", primary: true },
    { from: "feed_effluent_exchanger", to: "synthesis_reactor", material: "preheated_syngas", stream: "intermediate", primary: true },
    { from: "synthesis_reactor", to: "feed_effluent_exchanger", material: "reactor_effluent", stream: "product", primary: true },
    { from: "feed_effluent_exchanger", to: "ammonia_condenser", material: "cooled_effluent", stream: "product", primary: true },
    { from: "ammonia_condenser", to: "ammonia_separator", material: "two_phase", stream: "product", primary: true },
    { from: "ammonia_separator", to: "syngas_compressor", material: "recycle_gas", stream: "intermediate", primary: false },
    // Refrigeration tie-in
    { from: "ammonia_condenser", to: "refrig_evaporator", material: "ammonia_vapor", stream: "product", primary: false },
    { from: "refrig_evaporator", to: "refrig_compressor", material: "ammonia_vapor", stream: "utility-cold", primary: false },
    { from: "refrig_compressor", to: "refrig_condenser", material: "high_pressure_nh3", stream: "utility-hot", primary: false },
    { from: "refrig_condenser", to: "refrig_evaporator", material: "liquid_nh3", stream: "utility-cold", primary: false },
    // Storage
    { from: "ammonia_separator", to: "ammonia_storage", material: "liquid_ammonia", stream: "product", primary: true },
    // Utilities
    { from: "cooling_tower", to: "ammonia_condenser", material: "cooling_water", stream: "utility-cold", primary: false },
    { from: "cooling_tower", to: "refrig_condenser", material: "cooling_water", stream: "utility-cold", primary: false },
    { from: "boiler", to: "syngas_compressor", material: "hp_steam", stream: "utility-hot", primary: false },
    { from: "boiler", to: "primary_reformer", material: "hp_steam", stream: "utility-hot", primary: false },
  ],

  processOverview:
    "Natural gas is compressed, heated, and desulfurized to protect the nickel catalyst. It then enters the primary reformer where steam-methane reforming produces a hydrogen-rich gas; the secondary reformer injects air which provides the nitrogen for ammonia and completes the reforming. The hot syngas is cooled in a waste heat boiler (raising steam) and passes through high- and low-temperature shift reactors that convert CO to CO₂. CO₂ is removed in an absorber/stripper pair using a chemical solvent. Residual carbon oxides are converted to methane in the methanator. The now-pure 3:1 H₂/N₂ syngas is compressed to ~150 bar, preheated, and fed to the ammonia synthesis converter where it reacts over an iron catalyst. The effluent is cooled (with the cold feed and with refrigerated ammonia), the condensed ammonia is separated, and the unreacted gas is recycled. Liquid ammonia goes to refrigerated atmospheric storage. A cooling tower rejects process heat, an auxiliary boiler supplements steam, and a flare handles waste gases.",

  theme: {
    equipmentColor: "#94a3b8",
    structureColor: "#475569",
    accent: "#22d3ee",
    mood: "industrial-grey",
    backdrop: "cooling-towers",
  },
};
