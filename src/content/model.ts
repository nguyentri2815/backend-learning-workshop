export type JourneyId = "environment" | "policy" | "claims";
export type EvidenceState = "demo" | "verified" | "pending";
export type View = "result" | "source" | "practice";
export type Side = "before" | "after" | "diff";
export interface SourceFile {
  id: string;
  path: string;
  symbol: string;
  role: string;
  input: string;
  output: string;
  before: string;
  after: string;
  range: [number, number];
  links: { target: string; label: string }[];
}
export interface LearningStep {
  id: string;
  title: string;
  short: string;
  goal: string;
  why: string;
  expected: string;
  check: string;
  practice: string;
  evidence: string;
  file: string;
  range?: [number, number];
  command?: string;
  explanation: string;
}
export interface Journey {
  id: JourneyId;
  number: string;
  title: string;
  subtitle: string;
  summary: string;
  outcome: string;
  duration: string;
  state: EvidenceState;
  steps: LearningStep[];
  files: SourceFile[];
}
