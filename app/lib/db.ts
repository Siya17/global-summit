import { defaultRegulations } from "./regulations";
import { defaultThresholds, type Regulation, type Submission, type SummitSession, type Thresholds } from "./types";
type RuntimeEnv={DB?:D1Database;INSTRUCTOR_EMAIL?:string;INSTRUCTOR_PASSWORD?:string};
declare global { var __SUMMIT_RUNTIME_ENV__: RuntimeEnv | undefined; }
const runtime=()=>globalThis.__SUMMIT_RUNTIME_ENV__||{};
const db=()=>{const bindings=runtime();if(!bindings.DB)throw new Error("The summit database is not available.");return bindings.DB};
let ready:Promise<void>|null=null;
export const ensureDatabase=()=>ready??=(initialize().catch(e=>{ready=null;throw e}));
async function initialize(){const d=db();await d.batch([
  d.prepare("CREATE TABLE IF NOT EXISTS summit_sessions (id TEXT PRIMARY KEY, session_code TEXT NOT NULL UNIQUE, title TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'open', thresholds_json TEXT NOT NULL, framework_json TEXT NOT NULL DEFAULT '[]', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
  d.prepare("CREATE TABLE IF NOT EXISTS regulations (id TEXT PRIMARY KEY, number INTEGER NOT NULL UNIQUE, title TEXT NOT NULL, legal_text TEXT NOT NULL, evidence_for TEXT NOT NULL, evidence_challenge TEXT NOT NULL, evidence_data_point TEXT NOT NULL, sources_json TEXT NOT NULL DEFAULT '[]')"),
  d.prepare("CREATE TABLE IF NOT EXISTS group_submissions (id TEXT PRIMARY KEY, session_id TEXT NOT NULL, group_name TEXT NOT NULL, group_key TEXT NOT NULL, participant_names TEXT NOT NULL DEFAULT '', responses_json TEXT NOT NULL DEFAULT '{}', submitted INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(session_id, group_key))"),
  d.prepare("CREATE INDEX IF NOT EXISTS submissions_session_idx ON group_submissions(session_id)")]);
  await d.prepare("INSERT OR IGNORE INTO summit_sessions (id,session_code,title,status,thresholds_json,framework_json) VALUES (?,?,?,'open',?,'[]')").bind("session-peace26","PEACE26","Global Summit on Emerging Technology and Peace",JSON.stringify(defaultThresholds)).run();
  const legacy=await d.prepare("SELECT id FROM regulations WHERE id=?").bind("meaningful-human-control").first();
  if(legacy)await d.prepare("DELETE FROM regulations").run();
  await d.batch(defaultRegulations.map(x=>d.prepare("INSERT OR IGNORE INTO regulations (id,number,title,legal_text,evidence_for,evidence_challenge,evidence_data_point,sources_json) VALUES (?,?,?,?,?,?,?,?)").bind(x.id,x.number,x.title,x.text,x.evidenceFor,x.evidenceChallenge,x.evidenceDataPoint,JSON.stringify(x.sources))));}
export const instructorAuthorized=(request:Request)=>{const bindings=runtime();const expectedEmail=(bindings.INSTRUCTOR_EMAIL||process.env.INSTRUCTOR_EMAIL)?.trim().toLocaleLowerCase();const expectedPassword=bindings.INSTRUCTOR_PASSWORD||process.env.INSTRUCTOR_PASSWORD;const suppliedEmail=request.headers.get("x-instructor-email")?.trim().toLocaleLowerCase();return Boolean(expectedEmail&&expectedPassword&&suppliedEmail===expectedEmail&&request.headers.get("x-instructor-password")===expectedPassword)};
type SessionRow={id:string;session_code:string;title:string;status:"open"|"closed";thresholds_json:string;framework_json:string;created_at:string};
type RegulationRow={id:string;number:number;title:string;legal_text:string;evidence_for:string;evidence_challenge:string;evidence_data_point:string;sources_json:string};
type SubmissionRow={id:string;session_id:string;group_name:string;participant_names:string;responses_json:string;submitted:number;created_at:string;updated_at:string};
const mapSession=(x:SessionRow):SummitSession=>({id:x.id,sessionCode:x.session_code,title:x.title,status:x.status,thresholds:JSON.parse(x.thresholds_json) as Thresholds,framework:JSON.parse(x.framework_json) as number[],createdAt:x.created_at});
const mapRegulation=(x:RegulationRow):Regulation=>({id:x.id,number:x.number,title:x.title,text:x.legal_text,evidenceFor:x.evidence_for,evidenceChallenge:x.evidence_challenge,evidenceDataPoint:x.evidence_data_point,evidenceBars:defaultRegulations.find(item=>item.id===x.id)?.evidenceBars,sources:JSON.parse(x.sources_json)});
const mapSubmission=(x:SubmissionRow,names=false):Submission=>({id:x.id,sessionId:x.session_id,groupName:x.group_name,participantNames:names?x.participant_names:undefined,responses:JSON.parse(x.responses_json),submitted:Boolean(x.submitted),createdAt:x.created_at,updatedAt:x.updated_at});
export async function getSession(code:string){await ensureDatabase();const x=await db().prepare("SELECT * FROM summit_sessions WHERE session_code=?").bind(code.trim().toUpperCase()).first<SessionRow>();return x?mapSession(x):null}
export async function getRegulations(){await ensureDatabase();const x=await db().prepare("SELECT * FROM regulations ORDER BY number").all<RegulationRow>();return x.results.map(mapRegulation)}
export async function getSubmissions(sessionId:string,names=false){await ensureDatabase();const x=await db().prepare("SELECT * FROM group_submissions WHERE session_id=? ORDER BY updated_at DESC").bind(sessionId).all<SubmissionRow>();return x.results.map(row=>mapSubmission(row,names))}
export const database=db;
