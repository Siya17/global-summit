export type Decision = "keep" | "revise" | "remove" | "unsure";
export type Feasibility = "realistic" | "difficult" | "not-realistic";
export type Priority = "essential" | "negotiable" | "not-necessary";
export type Obstacle = "sovereignty" | "verification" | "military-necessity" | "capacity" | "uncertainty" | "unequal-effects" | "enforcement" | "other";
export type Source = { label: string; url: string };
export type Regulation = { id: string; number: number; title: string; text: string; evidenceFor: string; evidenceChallenge: string; evidenceDataPoint: string; sources: Source[] };
export type RegulationResponse = { decision?: Decision; feasibility?: Feasibility; priority?: Priority; obstacle?: Obstacle; otherObstacle?: string; proposedRevision?: string; reasoning?: string };
export type Responses = Record<string, RegulationResponse>;
export type Thresholds = { consensusSupport: number; consensusFeasibility: number; necessaryEssential: number; revisionNeeded: number; contestedMinimum: number; lowPriorityEssential: number; frameworkSupport: number; frameworkEssential: number; frameworkRejectionMax: number };
export type SummitSession = { id: string; sessionCode: string; title: string; status: "open" | "closed"; thresholds: Thresholds; framework: number[]; createdAt: string };
export type Submission = { id: string; sessionId: string; groupName: string; participantNames?: string; responses: Responses; submitted: boolean; createdAt: string; updatedAt: string };

export const decisionLabels: Record<Decision, string> = { keep: "Keep as written", revise: "Keep, but revise", remove: "Remove", unsure: "Unsure" };
export const feasibilityLabels: Record<Feasibility, string> = { realistic: "Realistic", difficult: "Difficult but possible", "not-realistic": "Not realistic" };
export const priorityLabels: Record<Priority, string> = { essential: "Essential", negotiable: "Useful but negotiable", "not-necessary": "Not necessary" };
export const obstacleLabels: Record<Obstacle, string> = { sovereignty: "State sovereignty", verification: "Verification", "military-necessity": "Military necessity", capacity: "Cost or limited capacity", uncertainty: "Technological uncertainty", "unequal-effects": "Unequal effects between countries", enforcement: "Enforcement", other: "Other" };
export const defaultThresholds: Thresholds = { consensusSupport: 60, consensusFeasibility: 50, necessaryEssential: 50, revisionNeeded: 40, contestedMinimum: 25, lowPriorityEssential: 25, frameworkSupport: 55, frameworkEssential: 40, frameworkRejectionMax: 25 };
