import { defaultThresholds, type Decision, type Feasibility, type Obstacle, type Priority, type Regulation, type Submission, type Thresholds } from "./types";
export type Category = "Strong consensus" | "Necessary but difficult" | "Revision needed" | "Contested" | "Low priority";
export type Aggregate = { regulation: Regulation; total: number; decision: Record<Decision, number>; feasibility: Record<Feasibility, number>; priority: Record<Priority, number>; obstacle: Record<Obstacle, number>; revisions: string[]; reasoning: string[]; support: number; feasible: number; essential: number; rejected: number; category: Category };
export const pct = (value: number, total: number) => total ? Math.round(value / total * 100) : 0;
export function classify(v: Pick<Aggregate,"support"|"feasible"|"essential"|"rejected"|"decision">, total: number, t: Thresholds = defaultThresholds): Category {
  if (v.essential >= t.necessaryEssential && v.feasible < t.consensusFeasibility) return "Necessary but difficult";
  if (pct(v.decision.revise,total) >= t.revisionNeeded) return "Revision needed";
  if (pct(v.decision.keep,total) >= t.contestedMinimum && v.rejected >= t.contestedMinimum) return "Contested";
  if (v.essential < t.lowPriorityEssential) return "Low priority";
  if (v.support >= t.consensusSupport && v.feasible >= t.consensusFeasibility) return "Strong consensus";
  return "Contested";
}
export function aggregateResponses(regulations: Regulation[], submissions: Submission[], t: Thresholds): Aggregate[] {
  const valid=submissions.filter(s=>s.submitted);
  return regulations.map(regulation=>{
    const decision:Record<Decision,number>={keep:0,revise:0,remove:0,unsure:0};
    const feasibility:Record<Feasibility,number>={realistic:0,difficult:0,"not-realistic":0};
    const priority:Record<Priority,number>={essential:0,negotiable:0,"not-necessary":0};
    const obstacle:Record<Obstacle,number>={sovereignty:0,verification:0,"military-necessity":0,capacity:0,uncertainty:0,"unequal-effects":0,enforcement:0,other:0};
    const revisions:string[]=[],reasoning:string[]=[]; let total=0;
    for(const s of valid){const x=s.responses[regulation.id];if(!x?.decision||!x.feasibility||!x.priority||!x.obstacles?.length)continue;total++;decision[x.decision]++;feasibility[x.feasibility]++;priority[x.priority]++;for(const o of x.obstacles)obstacle[o]++;if(x.proposedRevision?.trim())revisions.push(x.proposedRevision.trim());if(x.reasoning?.trim())reasoning.push(x.reasoning.trim())}
    const support=pct(decision.keep+decision.revise,total),feasible=pct(feasibility.realistic+feasibility.difficult,total),essential=pct(priority.essential,total),rejected=pct(decision.remove,total);const metrics={support,feasible,essential,rejected};
    return{regulation,total,decision,feasibility,priority,obstacle,revisions,reasoning,...metrics,category:classify({...metrics,decision},total,t)};
  });
}
export const defaultFramework=(items:Aggregate[],t:Thresholds)=>items.filter(x=>x.support>=t.frameworkSupport&&x.essential>=t.frameworkEssential&&x.rejected<=t.frameworkRejectionMax).map(x=>x.regulation.number);
