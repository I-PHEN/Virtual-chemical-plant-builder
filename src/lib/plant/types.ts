// Core type definitions for the AI Chemical Plant Explorer

export type EquipmentType =
  | "pump"
  | "tank"
  | "reactor"
  | "heatExchanger"
  | "compressor"
  | "valve"
  | "pipe"
  | "column"
  | "separator"
  | "cooler"
  | "filter"
  | "motor"
  | "storageTank"
  | "heater";

export type EquipmentCategory =
  | "processing"
  | "storage"
  | "flow"
  | "control"
  | "utility";

export interface EquipmentMetadata {
  type: EquipmentType;
  singularName: string;
  category: EquipmentCategory;
  /** Short tag-line shown in lists */
  tagline: string;
  purpose: string;
  workingPrinciple: string;
  inputs: string[];
  outputs: string[];
  operatingConditions: string;
  safetyConcerns: string[];
  failureModes: string[];
  equations: { name: string; formula: string; description: string }[];
  interviewQuestions: string[];
  /** Base hex color used for the procedural 3D model */
  color: string;
}

export interface EquipmentInstance {
  id: string;
  type: EquipmentType;
  /** Display name, e.g. "Feed Pump P-101" */
  name: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  /** Optional plant-specific context the AI can reference */
  context?: string;
}

export interface PipeSegment {
  id: string;
  from: string; // equipment id
  to: string; // equipment id
  /** Explicit polyline points. If omitted, derived from equipment positions */
  points?: [number, number, number][];
  label?: string;
  /** Visual color of the stream (e.g. feed, product, utility) */
  stream?: "feed" | "product" | "intermediate" | "utility-hot" | "utility-cold";
  /** How the pipe is routed: "rack" (up to pipe rack, along, down) or "direct" (short arc) */
  routing?: "rack" | "direct";
  /** Which pipe rack corridor to use (if routing is "rack") */
  rackId?: string;
}

/** A process area grouping equipment together (like a real plant plot plan) */
export interface ProcessArea {
  id: string;
  name: string; // "Reactor Area", "Tank Farm"
  kind: "process" | "storage" | "utility" | "control" | "flare";
  /** Ground footprint of the area */
  footprint: { x: number; z: number; width: number; depth: number };
  /** Whether the area is bunded (surrounded by a low wall for spill containment) */
  bunded?: boolean;
  /** Equipment IDs that belong to this area */
  equipmentIds: string[];
}

/** An elevated pipe rack corridor running between process areas */
export interface PipeRackCorridor {
  id: string;
  from: { x: number; z: number };
  to: { x: number; z: number };
  /** Height of the rack (typically 6-8m) */
  height: number;
  /** Number of tier levels (1 or 2) */
  levels: number;
}

/** Static structures in the plant (platforms, stairways, bunds, roads) */
export interface Structure {
  id: string;
  kind: "platform" | "stairway" | "bund" | "road" | "fence";
  position: [number, number, number];
  size?: [number, number, number];
  rotation?: number;
}

export interface ProcessStep {
  order: number;
  title: string;
  description: string;
  equipmentId: string;
}

export interface PlantTemplate {
  id: string;
  name: string;
  /** Short headline shown on the welcome screen */
  tagline: string;
  description: string;
  keywords: string[];
  equipment: EquipmentInstance[];
  pipes: PipeSegment[];
  processOverview: string;
  processSteps: ProcessStep[];
  /** Process areas grouping equipment (for realistic layout) */
  areas?: ProcessArea[];
  /** Elevated pipe rack corridors */
  racks?: PipeRackCorridor[];
  /** Static structures (platforms, stairways, bunds) */
  structures?: Structure[];
  /** Difficulty for landing screen display */
  difficulty?: "Beginner" | "Intermediate" | "Advanced";
  /** Estimated tour time in minutes */
  estimatedTime?: number;
}

export type DisplayState = "visible" | "highlighted" | "hidden";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  /** Optional action the assistant asked the frontend to perform */
  action?: AssistantAction;
}

export type AssistantAction =
  | { kind: "focus"; equipmentId: string }
  | { kind: "highlight"; equipmentType?: EquipmentType; equipmentId?: string }
  | { kind: "hide"; equipmentType: EquipmentType }
  | { kind: "showAll" }
  | { kind: "tour"; step: number }
  | { kind: "stopTour" }
  | { kind: "quiz"; question: string };

export interface PlantBuilderResult {
  plantId: string;
  plantName: string;
  intro: string;
}
