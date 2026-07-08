import type { EquipmentMetadata, EquipmentType } from "./types";

/**
 * The reusable knowledge library. Every equipment the AI talks about has
 * an entry here. This is the "LEGO brick" of the platform — the same
 * metadata is reused across every generated plant.
 */
export const EQUIPMENT_LIBRARY: Record<EquipmentType, EquipmentMetadata> = {
  pump: {
    type: "pump",
    singularName: "Centrifugal Pump",
    category: "flow",
    tagline: "Moves liquid by adding pressure energy",
    purpose:
      "A pump increases the pressure of a liquid so it can flow through pipes, overcome elevation differences, and feed downstream equipment such as heat exchangers, reactors, and columns. In almost every plant the feed first passes through a pump before anything else happens to it.",
    workingPrinciple:
      "A centrifugal pump uses a rotating impeller inside a volute casing. Liquid enters the eye of the impeller along the shaft axis, is flung outward by centrifugal force, and the volute converts the resulting kinetic energy into pressure head. The motor drives the impeller at high speed, typically 1500–3600 rpm.",
    inputs: ["Low-pressure liquid from a tank or upstream unit"],
    outputs: ["Higher-pressure liquid routed to downstream equipment"],
    operatingConditions:
      "Discharge pressure depends on the system curve; typical heads range from 20–200 m. Must be primed (filled with liquid) before starting. Net Positive Suction Head (NPSH) available must exceed NPSH required to avoid cavitation.",
    safetyConcerns: [
      "Cavitation — vapor bubbles collapse and erode the impeller",
      "Seal leaks releasing hazardous fluid",
      "Deadheading — running against a closed discharge valve overheats the pump",
      "Run-dry failure if the suction vessel empties",
    ],
    failureModes: [
      "Bearing wear from misalignment or poor lubrication",
      "Mechanical seal failure causing leakage",
      "Impeller erosion from cavitation or solids",
      "Motor overload from high discharge pressure",
    ],
    equations: [
      {
        name: "Pump head",
        formula: "H = (P2 − P1) / (ρg)",
        description:
          "Head H is the pressure rise converted to metres of liquid. P2 and P1 are discharge and suction pressure, ρ is density, g is gravity.",
      },
      {
        name: "Affinity laws",
        formula: "Q ∝ N,  H ∝ N²,  P ∝ N³",
        description:
          "Flow Q scales with speed N, head with N², and power with N³. Used when changing impeller speed or diameter.",
      },
      {
        name: "Pump hydraulic power",
        formula: "Ph = ρ g Q H",
        description:
          "Hydraulic power delivered to the fluid. Divide by pump efficiency to get shaft power from the motor.",
      },
    ],
    interviewQuestions: [
      "What is cavitation and how do you prevent it?",
      "Explain the difference between NPSH available and NPSH required.",
      "Why must you never start a centrifugal pump against a closed discharge valve for long?",
      "What do the affinity laws tell you about variable-speed pumping?",
    ],
    color: "#475569",
  },

  tank: {
    type: "tank",
    singularName: "Feed Tank",
    category: "storage",
    tagline: "Stores raw feed and buffers flow",
    purpose:
      "A feed tank holds raw material before it enters the process. It provides a buffer so downstream equipment sees a steady flow even when the supply is intermittent, and it lets operators inspect or pretreat the feed.",
    workingPrinciple:
      "A vertical cylindrical vessel with a dished or conical bottom. Liquid level is maintained by level controllers. A vent on the roof prevents pressure buildup. The outlet at the bottom feeds the suction of a pump.",
    inputs: ["Fresh feed delivered by truck, pipeline, or batch"],
    outputs: ["Steady liquid stream sent to the suction of a pump"],
    operatingConditions:
      "Atmospheric pressure typically. Level maintained between low and high alarms. Inlet and outlet isolated by gate valves for maintenance.",
    safetyConcerns: [
      "Overfilling causing spillage",
      "Tank rupture from overpressure or vacuum",
      "Static electricity buildup when handling flammables",
      "Corrosion of the tank floor leading to leaks",
    ],
    failureModes: [
      "Level instrument failure causing overflow or running the pump dry",
      "Vent blockage causing vacuum collapse during discharge",
      "Wall corrosion and pinhole leaks",
    ],
    equations: [
      {
        name: "Tank volume",
        formula: "V = π r² h",
        description:
          "Volume of a vertical cylinder: r is radius, h is liquid height. Used for inventory and residence time.",
      },
      {
        name: "Residence time",
        formula: "τ = V / Q",
        description:
          "How long the feed stays in the tank. Longer residence time gives more buffering against flow upsets.",
      },
    ],
    interviewQuestions: [
      "Why do storage tanks need a vent?",
      "How do you protect a tank from overfilling?",
      "What is residence time and why does it matter for a feed tank?",
    ],
    color: "#64748b",
  },

  storageTank: {
    type: "storageTank",
    singularName: "Product Storage Tank",
    category: "storage",
    tagline: "Stores finished product before dispatch",
    purpose:
      "A product storage tank holds the finished chemical before it is shipped to customers by truck, rail, or pipeline. It decouples production rate from dispatch schedule and lets quality be verified before release.",
    workingPrinciple:
      "Large cylindrical atmospheric tank, often with a floating roof for volatile products to minimise vapour space. Filled by the plant, emptied by a loading pump. Level and temperature are continuously monitored.",
    inputs: ["Product stream from the plant's final separator or cooler"],
    outputs: ["Product dispatched to trucks, rail cars, or pipeline"],
    operatingConditions:
      "Atmospheric pressure, ambient or trace-heated temperature. Capacity sized for several days of production.",
    safetyConcerns: [
      "Vapour emissions and fire risk for flammable products",
      "Floating-roof seal failure causing vapour release",
      "Bund (dyke) capacity must contain a full-tank leak",
    ],
    failureModes: [
      "Roof seal deterioration",
      "Bottom corrosion from water accumulation",
      "Level instrument drift",
    ],
    equations: [
      {
        name: "Storage capacity",
        formula: "V = π r² h",
        description: "Geometric volume; operational fill is usually limited to 90% for safety margin.",
      },
    ],
    interviewQuestions: [
      "Why use a floating-roof tank for volatile liquids?",
      "What is a bund and how is its capacity sized?",
    ],
    color: "#6b7280",
  },

  compressor: {
    type: "compressor",
    singularName: "Gas Compressor",
    category: "flow",
    tagline: "Raises the pressure of a gas stream",
    purpose:
      "A compressor increases the pressure of a gas so it can be transported through pipes, fed into a high-pressure reactor, or liquefied. The compressor is the gas-phase analogue of a pump.",
    workingPrinciple:
      "A centrifugal compressor accelerates gas with a rotating impeller and decelerates it in a diffuser, converting kinetic energy into pressure. Multiple stages are stacked in series for high pressure ratios. Because compressing a gas heats it, an intercooler is usually fitted between stages.",
    inputs: ["Low-pressure gas from a feed source or upstream unit"],
    outputs: ["High-pressure gas, usually hotter, sent downstream"],
    operatingConditions:
      "Discharge pressures from a few bar to hundreds of bar. Suction temperature and gas molecular weight strongly affect performance. Surge is a dangerous low-flow instability that must be controlled.",
    safetyConcerns: [
      "Surge — rapid flow reversal that can damage the compressor",
      "High discharge temperature igniting deposits",
      "Gas leaks at seals, especially for toxic or flammable gases",
      "High vibration from rotor imbalance",
    ],
    failureModes: [
      "Bearing and seal failure",
      "Impeller fouling and erosion",
      "Surge damage to blades",
      "Motor or turbine driver overload",
    ],
    equations: [
      {
        name: "Compressor polytropic head",
        formula: "Hp = (Z R T1 / M) · (n/(n−1)) · [(P2/P1)^((n−1)/n) − 1]",
        description:
          "Head delivered per kg of gas. Z is compressibility, R the gas constant, T1 suction temperature, M molecular weight, n the polytropic exponent.",
      },
      {
        name: "Compression power",
        formula: "P = m · Hp / ηp",
        description:
          "m is mass flow, Hp polytropic head, ηp polytropic efficiency. Intercooling reduces total work by keeping T1 low.",
      },
    ],
    interviewQuestions: [
      "What is compressor surge and how is it prevented?",
      "Why does compressing a gas heat it up, and why do we intercool?",
      "How does gas molecular weight affect compressor performance?",
    ],
    color: "#4b5563",
  },

  heatExchanger: {
    type: "heatExchanger",
    singularName: "Shell-and-Tube Heat Exchanger",
    category: "utility",
    tagline: "Transfers heat between two fluid streams",
    purpose:
      "A heat exchanger transfers thermal energy from a hot fluid to a cold fluid without letting them mix. It is used to preheat feed, cool products, recover waste heat, and condense vapours.",
    workingPrinciple:
      "One fluid flows through a bundle of parallel tubes while the other flows across the outside (shell side) of those tubes, guided by baffles. Heat conducts through the tube wall. Counter-current flow gives the highest temperature driving force and is preferred.",
    inputs: ["Hot process stream", "Cold cooling or heating medium"],
    outputs: ["Cooled hot stream", "Heated cold stream"],
    operatingConditions:
      "Design pressure and temperature set by ASME code. LMTD (log mean temperature difference) and overall coefficient U set the required heat transfer area. Fouling factor added to allow for scaling over time.",
    safetyConcerns: [
      "Tube rupture causing the two fluids to mix",
      "Thermal expansion stresses cracking tube-to-tubesheet joints",
      "High pressure on the shell side if a tube bursts",
    ],
    failureModes: [
      "Fouling reducing heat transfer and increasing pressure drop",
      "Tube corrosion and pinhole leaks",
      "Gasket failure on channel covers",
      "Vibration-induced tube damage from cross-flow",
    ],
    equations: [
      {
        name: "Heat duty",
        formula: "Q = U A ΔTlm",
        description:
          "Q is heat transferred, U the overall heat transfer coefficient, A the area, ΔTlm the log mean temperature difference between the streams.",
      },
      {
        name: "Log Mean Temperature Difference",
        formula: "ΔTlm = (ΔT1 − ΔT2) / ln(ΔT1 / ΔT2)",
        description:
          "ΔT1 and ΔT2 are the temperature approaches at each end of the exchanger. A correction factor F is applied for non-counter-current arrangements.",
      },
      {
        name: "Energy balance",
        formula: "Q = ṁhot cp (Thot,in − Thot,out) = ṁcold cp (Tcold,out − Tcold,in)",
        description:
          "Heat lost by the hot stream equals heat gained by the cold stream (neglecting losses).",
      },
    ],
    interviewQuestions: [
      "Why is counter-current flow preferred over co-current?",
      "What is LMTD and when do you need a correction factor?",
      "How does fouling affect heat exchanger performance over time?",
      "Explain the difference between shell-side and tube-side flow.",
    ],
    color: "#9ca3af",
  },

  heater: {
    type: "heater",
    singularName: "Fired Heater",
    category: "utility",
    tagline: "Raises process temperature using combustion",
    purpose:
      "A fired heater burns fuel gas or oil to raise the temperature of a process stream far above what steam can provide. Common before reactors that need high activation temperature.",
    workingPrinciple:
      "Process fluid flows through tubes arranged inside a refractory-lined firebox. Burners combust fuel at the base; hot flue gases radiate heat to the tubes and then convect past them on the way to the stack.",
    inputs: ["Cold process stream", "Fuel gas or oil", "Combustion air"],
    outputs: ["Hot process stream", "Flue gases to stack"],
    operatingConditions:
      "Tube skin temperatures monitored closely to avoid coking or rupture. Excess air controlled for efficiency. Draft balanced to prevent flame impingement.",
    safetyConcerns: [
      "Tube rupture releasing process fluid into the firebox",
      "Explosion from unburned fuel accumulating on light-off",
      "Coking inside tubes from overheating",
    ],
    failureModes: [
      "Tube creep and rupture at hot spots",
      "Refractory spalling",
      "Burner tip fouling causing flame imbalance",
    ],
    equations: [
      {
        name: "Heat duty",
        formula: "Q = ṁ cp (Tout − Tin)",
        description: "Heat absorbed by the process stream; matched against fuel lower heating value and heater efficiency.",
      },
    ],
    interviewQuestions: [
      "Why monitor tube skin temperature in a fired heater?",
      "What is excess air and why does it matter for efficiency?",
    ],
    color: "#7a6b5d",
  },

  cooler: {
    type: "cooler",
    singularName: "Product Cooler",
    category: "utility",
    tagline: "Cools a process stream using cooling water",
    purpose:
      "A cooler lowers the temperature of a product or intermediate stream before it is stored or further processed, typically by exchanging heat with cooling water or air.",
    workingPrinciple:
      "Usually a shell-and-tube exchanger operated as a cooler: hot process fluid on one side, cooling water on the other. Cooling water returns to a cooling tower to be reused.",
    inputs: ["Hot process stream", "Cooling water"],
    outputs: ["Cooled process stream", "Warmed cooling water to tower"],
    operatingConditions:
      "Cooling water supply typically 27–32 °C, return limited to ~50 °C to prevent scaling. Approach temperature limited by cooling water temperature.",
    safetyConcerns: [
      "Cooling water contamination if a tube leaks",
      "Scaling reducing heat transfer",
      "Loss of cooling water flow causing process over-temperature",
    ],
    failureModes: [
      "Tube fouling and corrosion",
      "Biofouling in cooling water circuit",
      "Control valve failure on cooling water side",
    ],
    equations: [
      {
        name: "Cooling duty",
        formula: "Q = ṁ cw cp (Tcw,out − Tcw,in)",
        description: "Heat picked up by the cooling water; equals heat lost by the process stream.",
      },
    ],
    interviewQuestions: [
      "Why is cooling water return temperature limited?",
      "What happens if cooling water flow is lost to a cooler?",
    ],
    color: "#7c8794",
  },

  reactor: {
    type: "reactor",
    singularName: "Chemical Reactor",
    category: "processing",
    tagline: "Where raw materials become products",
    purpose:
      "The reactor is the heart of any chemical plant — it is where feed molecules are converted into product molecules by chemical reaction. Everything else in the plant exists to feed the reactor or to separate its output.",
    workingPrinciple:
      "Reactants enter, react over a catalyst or under the action of heat/pressure, and products leave. Most industrial reactors are either packed-bed catalytic reactors (gas flows through a fixed bed of catalyst pellets) or stirred-tank reactors (a stirred liquid undergoes reaction). Heat must often be removed (exothermic) or supplied (endothermic) to hold the desired temperature.",
    inputs: ["Preheated reactant streams at reaction pressure"],
    outputs: ["A mixture of products, unconverted reactants, and by-products"],
    operatingConditions:
      "Set by the reaction kinetics and thermodynamics — pressure, temperature, and residence time chosen to maximise conversion and selectivity. Catalyst life sets the cycle length.",
    safetyConcerns: [
      "Runaway reaction from exotherm if heat removal fails",
      "Hot spots causing catalyst sintering or side reactions",
      "Overpressure from gas evolution or vaporisation",
      "Toxic catalyst handling during charge/discharge",
    ],
    failureModes: [
      "Catalyst deactivation by poisoning, fouling, or sintering",
      "Channeling and maldistribution through the bed",
      "Heat transfer surface fouling",
      "Pressure vessel fatigue",
    ],
    equations: [
      {
        name: "Rate law",
        formula: "r = k · C_A^n",
        description:
          "Reaction rate r depends on rate constant k and reactant concentration C_A raised to order n. k follows Arrhenius: k = A·exp(−Ea/RT).",
      },
      {
        name: "PFR design equation",
        formula: "V = F_A0 ∫ dX / (−rA)",
        description:
          "Volume V of a plug-flow reactor needed for conversion X. F_A0 is inlet molar flow, −rA the rate of disappearance.",
      },
      {
        name: "CSTR design equation",
        formula: "V = F_A0 · X / (−rA)|exit",
        description: "Volume of a continuously stirred tank reactor; rate evaluated at exit conditions.",
      },
      {
        name: "Residence time",
        formula: "τ = V / v",
        description: "Mean time a molecule spends in the reactor. v is volumetric flow.",
      },
    ],
    interviewQuestions: [
      "Compare PFR and CSTR — which gives higher conversion for the same volume and why?",
      "What causes catalyst deactivation in an industrial reactor?",
      "Explain reaction runaway and how it is prevented.",
      "Why does temperature affect rate exponentially?",
    ],
    color: "#6b6b6b",
  },

  column: {
    type: "column",
    singularName: "Distillation Column",
    category: "processing",
    tagline: "Separates a mixture by boiling point",
    purpose:
      "A distillation column separates a liquid mixture into two or more fractions of different volatility. It is the workhorse of separation in chemical engineering — refineries, solvent plants, and alcohol plants all rely on it.",
    workingPrinciple:
      "Vapour flows upward through trays or packing while liquid flows downward. On each tray the two phases contact and exchange material: vapour gets richer in the more volatile component, liquid in the less volatile. At the top, a condenser turns vapour into reflux; at the bottom, a reboiler turns liquid into boil-up. The counter-current contact is what makes the separation sharp.",
    inputs: ["Feed mixture introduced at the middle of the column"],
    outputs: ["Distillate (light components) at the top", "Bottoms (heavy components) at the base"],
    operatingConditions:
      "Operated at a pressure set by the cooling medium available for the condenser. Reflux ratio is the key operating variable — higher reflux gives sharper separation but costs more energy.",
    safetyConcerns: [
      "Overpressure from reboiler overheating or blocked vents",
      "Flooding — liquid carried up by vapour, causing loss of separation",
      "Weeping — liquid draining through tray holes at low vapour rate",
      "Hot spots in the reboiler causing thermal degradation",
    ],
    failureModes: [
      "Tray fouling and corrosion",
      "Packing maldistribution causing channeling",
      "Reboiler tube fouling",
      "Level control failure flooding the column",
    ],
    equations: [
      {
        name: "Fenske equation (minimum stages)",
        formula: "Nmin = log[(xD/(1−xD))·((1−xB)/xB)] / log(α)",
        description:
          "Minimum number of theoretical stages at total reflux. xD and xB are distillate and bottoms mole fractions of the light key, α the relative volatility.",
      },
      {
        name: "McCabe–Thiele",
        formula: "Operating lines: y = L/V·x + D/V·xD",
        description:
          "Graphical method to step off theoretical stages using the equilibrium curve and operating lines for rectifying and stripping sections.",
      },
      {
        name: "Reflux ratio",
        formula: "R = L / D",
        description:
          "L is reflux returned to the column, D distillate withdrawn. Operating reflux is typically 1.2–1.5 × Rmin.",
      },
    ],
    interviewQuestions: [
      "What is the reflux ratio and how does it affect separation and energy use?",
      "Explain the difference between minimum reflux and minimum stages.",
      "What is weeping and what is flooding in a tray column?",
      "Why do we use packing instead of trays in some columns?",
    ],
    color: "#52525b",
  },

  separator: {
    type: "separator",
    singularName: "Phase Separator",
    category: "processing",
    tagline: "Splits phases by gravity or centrifugal force",
    purpose:
      "A separator splits an incoming stream into two or more phases — typically gas from liquid, or two immiscible liquids. In an ammonia plant, for example, a separator splits unreacted gas from condensed ammonia.",
    workingPrinciple:
      "A vertical or horizontal vessel where the mixed stream enters and slows down. Gravity lets the denser phase settle to the bottom and the lighter phase rise to the top, each drawn off separately. Demister pads help coalesce liquid droplets from the gas.",
    inputs: ["Mixed two-phase stream from a cooler or reactor"],
    outputs: ["Light phase (usually gas) from the top", "Heavy phase (usually liquid) from the bottom"],
    operatingConditions:
      "Sized so the residence time is long enough for phase separation. Level interface between phases is controlled continuously.",
    safetyConcerns: [
      "Carry-over of liquid into gas outlet damaging downstream compressors",
      "High interface level displacing gas space",
      "Overpressure from blocked outlets",
    ],
    failureModes: [
      "Demister pad fouling causing liquid carry-over",
      "Level instrument failure",
      "Internal corrosion from sour service",
    ],
    equations: [
      {
        name: "Stokes' law settling velocity",
        formula: "vt = g d² (ρp − ρf) / (18 μ)",
        description:
          "Terminal settling velocity of a droplet of diameter d in a fluid of viscosity μ. Sets the vessel cross-sectional area needed.",
      },
      {
        name: "Residence time",
        formula: "τ = V / Q",
        description: "Liquid hold-up volume divided by liquid flow; must exceed the time needed for phases to separate.",
      },
    ],
    interviewQuestions: [
      "How is a separator sized?",
      "What is liquid carry-over and how is it prevented?",
      "Explain the role of a demister pad.",
    ],
    color: "#6b7280",
  },

  valve: {
    type: "valve",
    singularName: "Control Valve",
    category: "control",
    tagline: "Regulates flow, pressure, or isolation",
    purpose:
      "A valve regulates the flow of fluid — opening, closing, or throttling to control flow rate, pressure, or level in the plant. Valves are the primary control element in any process.",
    workingPrinciple:
      "A control valve uses an actuator to move a plug, ball, or disk relative to a seat, changing the open area and therefore the flow resistance. A globe valve throttles well; a gate valve isolates but does not throttle; a ball valve handles on/off service quickly.",
    inputs: ["Upstream fluid at higher pressure"],
    outputs: ["Downstream fluid at lower pressure and controlled flow rate"],
    operatingConditions:
      "Sized using the valve flow coefficient Cv. Must avoid cavitation (liquids) and choking (gases). Actuator sized to overcome maximum pressure differential.",
    safetyConcerns: [
      "Valve stem leak releasing hazardous fluid",
      "Fail-action (fail-open or fail-closed) on air loss must match process safety",
      "Cavitation and noise from high pressure drop",
    ],
    failureModes: [
      "Seat erosion from cavitation or solids",
      "Actuator air leak causing valve to drift to fail position",
      "Stem packing leak",
      "Positioner miscalibration",
    ],
    equations: [
      {
        name: "Valve flow equation (liquid)",
        formula: "Q = Cv · √(ΔP / SG)",
        description:
          "Q is flow, Cv the valve flow coefficient, ΔP the pressure drop, SG the specific gravity. Used to size control valves.",
      },
    ],
    interviewQuestions: [
      "What is the difference between fail-open and fail-closed, and how do you choose?",
      "Explain valve cavitation.",
      "What is Cv and how is it used to size a valve?",
    ],
    color: "#78716c",
  },

  filter: {
    type: "filter",
    singularName: "Filter",
    category: "processing",
    tagline: "Removes solids from a fluid stream",
    purpose:
      "A filter removes solid particles from a liquid or gas stream to protect downstream equipment, meet product purity, or recover a solid product.",
    workingPrinciple:
      "Fluid passes through a porous medium that captures solids on its surface or within its depth. As solids accumulate, pressure drop rises; the element is then backwashed, cleaned, or replaced.",
    inputs: ["Fluid containing suspended solids"],
    outputs: ["Cleaned fluid", "Captured solids (filter cake)"],
    operatingConditions:
      "Designed for a maximum pressure drop. Switching between duty and standby filters allows continuous operation during cleaning.",
    safetyConcerns: [
      "High ΔP causing element rupture",
      "Toxic or pyrophoric solids on the element during change-out",
      "Sudden pressure release during maintenance",
    ],
    failureModes: [
      "Element tearing from overpressure",
      "Bypass from poor sealing",
      "Blinding requiring frequent cleaning",
    ],
    equations: [
      {
        name: "Pressure drop",
        formula: "ΔP = Rm · μ · v",
        description: "Pressure drop across the medium; Rm is medium resistance, μ viscosity, v superficial velocity.",
      },
    ],
    interviewQuestions: [
      "When would you choose a cartridge filter over a bag filter?",
      "What does filter blinding mean?",
    ],
    color: "#8b8378",
  },

  motor: {
    type: "motor",
    singularName: "Electric Motor",
    category: "utility",
    tagline: "Drives rotating equipment",
    purpose:
      "An electric motor converts electrical energy into mechanical rotation, driving pumps, compressors, agitators, and conveyors throughout the plant.",
    workingPrinciple:
      "An AC induction motor uses a rotating magnetic field in the stator to induce current in the rotor, producing torque. A variable frequency drive (VFD) can adjust speed by changing the supply frequency.",
    inputs: ["Electrical power from the grid or a generator"],
    outputs: ["Mechanical shaft rotation"],
    operatingConditions:
      "Rated by power, speed, and voltage. Motor temperature class must suit any hazardous area. VFDs allow speed control to save energy.",
    safetyConcerns: [
      "Overheating in hazardous areas causing ignition",
      "Electrical fault causing fire",
      "Unexpected start-up during maintenance",
    ],
    failureModes: [
      "Bearing failure from poor lubrication",
      "Stator winding insulation breakdown",
      "VFD electronics failure",
    ],
    equations: [
      {
        name: "Motor power",
        formula: "P = √3 · V · I · cos φ · η",
        description: "Three-phase motor mechanical output; V line voltage, I line current, cos φ power factor, η efficiency.",
      },
    ],
    interviewQuestions: [
      "Why use a VFD on a pump or compressor?",
      "What is a hazardous-area-rated motor?",
    ],
    color: "#52525b",
  },

  pipe: {
    type: "pipe",
    singularName: "Pipe",
    category: "flow",
    tagline: "Carries fluid between equipment",
    purpose:
      "Pipes connect every piece of equipment in the plant, carrying fluids from one unit to another. They are sized to balance capital cost against pumping power.",
    workingPrinciple:
      "Circular cross-section pipes carry single-phase or two-phase fluids. Liquid velocity typically 1–3 m/s, gas 10–30 m/s. Pressure drop calculated from the Darcy–Weisbach equation.",
    inputs: ["Fluid from upstream equipment"],
    outputs: ["Same fluid delivered to downstream equipment"],
    operatingConditions:
      "Designed to ASME B31.3. Pressure rating set by flange class. Insulated for heat conservation or personnel protection.",
    safetyConcerns: [
      "Corrosion and erosion thinning the wall",
      "Vibration-induced fatigue at small-bore connections",
      "Gasket failure at flanges",
    ],
    failureModes: [
      "Wall thinning from corrosion/erosion",
      "Fatigue cracks at stress concentrations",
      "Flange leaks",
    ],
    equations: [
      {
        name: "Darcy–Weisbach",
        formula: "ΔP = f (L/D) (ρ v² / 2)",
        description: "Pressure drop in a pipe of length L, diameter D, friction factor f, fluid density ρ and velocity v.",
      },
      {
        name: "Reynolds number",
        formula: "Re = ρ v D / μ",
        description: "Determines laminar vs turbulent flow; sets the friction factor via the Moody chart.",
      },
    ],
    interviewQuestions: [
      "How do you size a pipe for a given flow rate?",
      "What is the typical liquid velocity in a process pipe and why?",
      "Explain Reynolds number and its significance.",
    ],
    color: "#9ca3af",
  },
};

export const ALL_EQUIPMENT_TYPES = Object.keys(EQUIPMENT_LIBRARY) as EquipmentType[];

export function getEquipmentMeta(type: EquipmentType): EquipmentMetadata {
  return EQUIPMENT_LIBRARY[type];
}
