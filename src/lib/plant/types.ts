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
  | { kind: "quiz"; question: string };

export interface PlantBuilderResult {
  plantId: string;
  plantName: string;
  intro: string;
}
