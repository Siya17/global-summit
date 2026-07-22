"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { GlossaryText } from "../components/GlossaryText";
import { SiteHeader } from "../components/SiteHeader";
import { firebaseAvailable, firebaseLoadDraft, firebaseLoadSession, firebaseSaveSubmission } from "../lib/firebaseBackend";
import {
  decisionLabels,
  feasibilityLabels,
  obstacleLabels,
  priorityLabels,
  type EvidenceBar,
  type Obstacle,
  type Regulation,
  type RegulationResponse,
  type Responses,
  type SummitSession,
} from "../lib/types";

type Stage = "join" | "review" | "summary" | "submitted";

const MAX_OBSTACLES = 3;

const required = (response?: RegulationResponse, requireReasoning = false) =>
  Boolean(
    response?.decision &&
      response.feasibility &&
      response.priority &&
      response.obstacles?.length &&
      (!response.obstacles.includes("other") || response.otherObstacle?.trim()) &&
      (!requireReasoning || response.reasoning?.trim()),
  );

function ChoiceGroup<T extends string>({
  legend,
  value,
  options,
  onChange,
}: {
  legend: string;
  value?: T;
  options: Record<T, string>;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset className="choice-field">
      <legend>
        {legend}
        <span>Required</span>
      </legend>
      <div className="choice-grid">
        {Object.entries(options).map(([key, label]) => (
          <label key={key} className={value === key ? "choice selected" : "choice"}>
            <input type="radio" name={legend} checked={value === key} onChange={() => onChange(key as T)} />
            <span>{label as string}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function MultiChoiceGroup<T extends string>({
  legend,
  hint,
  values,
  options,
  max,
  onToggle,
}: {
  legend: string;
  hint: string;
  values: T[];
  options: Record<T, string>;
  max: number;
  onToggle: (value: T) => void;
}) {
  return (
    <fieldset className="choice-field">
      <legend>
        {legend}
        <span>{hint}</span>
      </legend>
      <div className="choice-grid">
        {Object.entries(options).map(([key, label]) => {
          const checked = values.includes(key as T);
          const disabled = !checked && values.length >= max;
          return (
            <label key={key} className={checked ? "choice selected" : disabled ? "choice disabled" : "choice"}>
              <input type="checkbox" checked={checked} disabled={disabled} onChange={() => onToggle(key as T)} />
              <span>{label as string}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function EvidenceBars({ bars }: { bars?: EvidenceBar[] }) {
  if (!bars?.length) return null;
  return (
    <figure className="evidence-chart" aria-label={bars.map((item) => `${item.label}: ${item.display}`).join("; ")}>
      {bars.map((item) => (
        <div className="evidence-bar-row" key={item.label}>
          <div>
            <span>{item.label}</span>
            <strong>{item.display}</strong>
          </div>
          <i aria-hidden="true">
            <em style={{ width: `${Math.max(3, Math.min(100, (item.value / item.max) * 100))}%` }} />
          </i>
        </div>
      ))}
    </figure>
  );
}

// A device with no local draft (a new laptop, a released device lock, a
// cleared browser) resumes from the group's last saved answers instead of
// silently starting blank — which would otherwise overwrite real progress on
// the very next save. Never blocks joining: any failure just means "start
// fresh," the same as before this existed.
async function loadRemoteDraft(code: string, groupName: string) {
  const trimmed = groupName.trim();
  if (!trimmed) return null;
  try {
    if (firebaseAvailable()) return await firebaseLoadDraft(code, trimmed);
    const result = await fetch(`/api/submissions?code=${encodeURIComponent(code)}`);
    if (!result.ok) return null;
    const body = (await result.json()) as { submissions?: { id: string; groupName: string; responses: Responses }[] };
    const match = body.submissions?.find((item) => item.groupName.trim().toLocaleLowerCase() === trimmed.toLocaleLowerCase());
    return match ? { id: match.id, responses: match.responses } : null;
  } catch {
    return null;
  }
}

export function SummitApp() {
  const [stage, setStage] = useState<Stage>("join");
  const [code, setCode] = useState("PEACE26");
  const [groupName, setGroupName] = useState("");
  const [names, setNames] = useState("");
  const [session, setSession] = useState<SummitSession | null>(null);
  const [regulations, setRegulations] = useState<Regulation[]>([]);
  const [responses, setResponses] = useState<Responses>({});
  const [index, setIndex] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [submissionId, setSubmissionId] = useState("");
  const [autosaveState, setAutosaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const autosaveSaving = useRef(false);
  // A cheap, best-effort lookup so the join screen can already read "individual
  // make-up" before the student submits the form — never blocks joining, and
  // the authoritative check happens again in enter() once the session loads.
  const [joinPreview, setJoinPreview] = useState<{ isMakeup: boolean } | null>(null);

  const isMakeup = Boolean(session?.isMakeup);
  const completed = useMemo(
    () => regulations.filter((regulation) => required(responses[regulation.id], isMakeup)).length,
    [regulations, responses, isMakeup],
  );
  const current = regulations[index];
  const response = current ? responses[current.id] || {} : {};

  useEffect(() => {
    if (!groupName || !regulations.length) return;
    localStorage.setItem(
      `summit-draft:${code}:${groupName.toLocaleLowerCase()}`,
      JSON.stringify({ responses, submissionId }),
    );
  }, [responses, submissionId, groupName, code, regulations.length]);

  const update = (patch: Partial<RegulationResponse>) => {
    if (!current) return;
    setResponses((previous) => ({
      ...previous,
      [current.id]: { ...previous[current.id], ...patch },
    }));
  };

  const toggleObstacle = (value: Obstacle) => {
    const selected = response.obstacles || [];
    const next = selected.includes(value)
      ? selected.filter((item) => item !== value)
      : selected.length < MAX_OBSTACLES
        ? [...selected, value]
        : selected;
    update({ obstacles: next });
  };

  useEffect(() => {
    if (stage !== "join" || !code.trim()) {
      setJoinPreview(null);
      return;
    }
    const normalized = code.trim().toUpperCase();
    const timer = setTimeout(async () => {
      try {
        let data: { session: SummitSession };
        if (firebaseAvailable()) data = await firebaseLoadSession(normalized);
        else {
          const result = await fetch(`/api/session?code=${encodeURIComponent(normalized)}`);
          if (!result.ok) return setJoinPreview(null);
          data = await result.json();
        }
        setJoinPreview({ isMakeup: Boolean(data.session.isMakeup) });
      } catch {
        setJoinPreview(null);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [code, stage]);

  async function enter(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const normalized = code.toUpperCase();
      let data: { session: SummitSession; regulations: Regulation[] };
      if (firebaseAvailable()) {
        data = await firebaseLoadSession(normalized);
      } else {
        const result = await fetch(`/api/session?code=${encodeURIComponent(normalized)}`);
        const body = await result.json();
        if (!result.ok) throw new Error(body.error);
        data = body;
      }
      if (data.session.status !== "open") throw new Error("This summit is currently closed to new responses.");
      setSession(data.session);
      setRegulations(data.regulations);
      const saved = localStorage.getItem(`summit-draft:${normalized}:${groupName.toLocaleLowerCase()}`);
      const localDraft = saved ? JSON.parse(saved) : null;
      if (localDraft?.responses && Object.keys(localDraft.responses).length) {
        setResponses(localDraft.responses);
        setSubmissionId(localDraft.submissionId || "");
      } else {
        // No usable draft on this device — check whether this group already
        // has saved progress on the server (autosave from another device,
        // or this device after the instructor released a locked group).
        const remote = await loadRemoteDraft(normalized, groupName);
        if (remote) {
          setResponses(remote.responses || {});
          setSubmissionId(remote.id);
        }
      }
      setCode(normalized);
      setStage("review");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to enter the summit.");
    } finally {
      setBusy(false);
    }
  }

  function next() {
    if (!required(response, isMakeup)) {
      setError(isMakeup ? "Complete the four required judgments and your written reasoning before continuing." : "Complete the four required judgments before continuing.");
      return;
    }
    setError("");
    flushAutosave();
    if (index === regulations.length - 1) setStage("summary");
    else {
      setIndex((value) => value + 1);
      window.scrollTo(0, 0);
    }
  }

  async function persist(submittedFlag: boolean) {
    if (firebaseAvailable()) {
      const result = await firebaseSaveSubmission({
        code,
        id: submissionId || undefined,
        groupName,
        participantNames: names,
        responses,
        submitted: submittedFlag,
      });
      return result.id;
    }
    const result = await fetch("/api/submissions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        code,
        id: submissionId || undefined,
        groupName,
        participantNames: names,
        responses,
        submitted: submittedFlag,
      }),
    });
    const body = await result.json();
    if (!result.ok) throw new Error(body.error);
    return body.submission.id as string;
  }

  // Saves progress in the background as the group works, so a crashed laptop
  // or a closed tab never costs more than a couple of seconds of answers.
  // Silent on failure by design — a stalled autosave should never interrupt
  // deliberation; the status text is the only signal, and Submit still runs
  // its own explicit save with a real error message.
  async function flushAutosave() {
    if (autosaveSaving.current || !session) return;
    if (!groupName.trim() || !Object.keys(responses).length) return;
    autosaveSaving.current = true;
    setAutosaveState("saving");
    try {
      const id = await persist(false);
      setSubmissionId(id);
      setAutosaveState("saved");
    } catch {
      setAutosaveState("error");
    } finally {
      autosaveSaving.current = false;
    }
  }

  useEffect(() => {
    if (!session || !groupName.trim() || !Object.keys(responses).length) return;
    const timer = setTimeout(() => {
      flushAutosave();
    }, 2500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [responses]);

  async function submit() {
    if (completed !== regulations.length) {
      setError(isMakeup ? `Complete all ${regulations.length} themes, including your written reasoning, before submitting.` : `Complete all ${regulations.length} themes before submitting.`);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const id = await persist(true);
      setSubmissionId(id);
      localStorage.setItem(
        `summit-draft:${code}:${groupName.toLocaleLowerCase()}`,
        JSON.stringify({ responses, submissionId: id }),
      );
      setStage("submitted");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Submission failed.");
    } finally {
      setBusy(false);
    }
  }

  if (stage === "join") {
    return (
      <main>
        <div className="app-shell">
          <SiteHeader />
          <section className="join-layout">
            <div>
              <p className="eyebrow">Student delegation desk</p>
              <h1>Enter your summit session</h1>
              <p className="lede">{joinPreview?.isMakeup ? "Complete this activity individually as make-up for a missed class session." : "Join as one equal working group. No countries or political blocs are assigned."}</p>
              <div className="callout">
                <strong>Before you begin</strong>
                <p>
                  {joinPreview?.isMakeup
                    ? "Plan for about 30 minutes. You will judge four themes on your own, each bundling two or three linked rules. Since there’s no group to discuss with, you’ll also write a short reason for each theme."
                    : "Plan for about 30 minutes. You will judge four themes, each bundling two or three linked rules. Discuss together and nominate one person to enter the group’s response."}
                </p>
              </div>
            </div>
            <form className="panel join-form" onSubmit={enter}>
              <label>
                Session code
                <input value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} maxLength={10} required />
              </label>
              <label>
                {joinPreview?.isMakeup ? "Your name" : "Group name or number"}
                <input value={groupName} onChange={(event) => setGroupName(event.target.value)} placeholder={joinPreview?.isMakeup ? "e.g. Jordan Lee" : "e.g. Group 4"} required />
              </label>
              <label>
                {joinPreview?.isMakeup ? "Notes" : "Participant names"} <span className="optional">Optional</span>
                <textarea value={names} onChange={(event) => setNames(event.target.value)} placeholder={joinPreview?.isMakeup ? "Anything your instructor should know" : "Separate names with commas"} rows={3} />
              </label>
              {error && <p className="error" role="alert">{error}</p>}
              <button className="button primary wide" disabled={busy}>{busy ? "Checking session…" : "Begin deliberation →"}</button>
              <p className="form-note">No visible student account is required. A recoverable draft remains on this device.</p>
            </form>
          </section>
        </div>
      </main>
    );
  }

  if (stage === "submitted") {
    const essentials = regulations
      .filter((regulation) => responses[regulation.id]?.priority === "essential" && responses[regulation.id]?.decision !== "remove")
      .slice(0, 3);
    const unrealistic = regulations.filter((regulation) => responses[regulation.id]?.feasibility === "not-realistic");
    return (
      <main>
        <div className="app-shell">
          <SiteHeader compact />
          <section className="result-card">
            <div className="success-mark">✓</div>
            <p className="eyebrow">Response recorded</p>
            <h1>Thank you, {groupName}.</h1>
            <p>
              {isMakeup
                ? "You can reopen this device’s saved draft and resubmit while this make-up session remains open. The existing entry will be updated, not duplicated."
                : "Your group can reopen this device’s saved draft and resubmit while the session remains open. The existing entry will be updated, not duplicated."}
            </p>
            <div className="result-grid">
              <div>
                <h2>Your highest-priority principles</h2>
                <ol>{essentials.length ? essentials.map((regulation) => <li key={regulation.id}><span>{String(regulation.number).padStart(2, "0")}</span>{regulation.title}</li>) : <li>No principles were marked Essential.</li>}</ol>
              </div>
              <div>
                <h2>Least realistic</h2>
                <ul>{unrealistic.length ? unrealistic.map((regulation) => <li key={regulation.id}>{regulation.number}. {regulation.title}</li>) : <li>None marked Not realistic.</li>}</ul>
              </div>
            </div>
            <div className="hero-actions">
              <Link className="button primary" href={`/dashboard?code=${code}`}>View class dashboard</Link>
              <button className="button secondary" onClick={() => setStage("summary")}>Edit &amp; resubmit</button>
            </div>
          </section>
        </div>
      </main>
    );
  }

  if (stage === "summary") {
    return (
      <main>
        <div className="app-shell">
          <SiteHeader compact />
          <section className="review-head">
            <div>
              <p className="eyebrow">Final check · {completed} of {regulations.length} complete</p>
              <h1>Review your framework</h1>
              <p>Open any theme to change {isMakeup ? "your judgment" : "the group’s judgment"} before submitting.</p>
            </div>
            <button className="button primary" onClick={submit} disabled={busy || completed !== regulations.length}>{busy ? "Submitting…" : "Submit framework"}</button>
          </section>
          {error && <p className="error centered" role="alert">{error}</p>}
          <div className="review-list">
            {regulations.map((regulation, regulationIndex) => {
              const item = responses[regulation.id];
              return (
                <button key={regulation.id} className="review-row" onClick={() => { setIndex(regulationIndex); setStage("review"); }}>
                  <span className="reg-number">{String(regulation.number).padStart(2, "0")}</span>
                  <span>
                    <strong>{regulation.title}</strong>
                    <small>{item?.decision ? decisionLabels[item.decision] : "Incomplete"} · {item?.priority ? priorityLabels[item.priority] : "Priority missing"}</small>
                  </span>
                  <span className={required(item, isMakeup) ? "status complete" : "status"}>{required(item, isMakeup) ? "Complete" : "Edit"} →</span>
                </button>
              );
            })}
          </div>
          <div className="sticky-submit">
            <button className="button primary wide" onClick={submit} disabled={busy || completed !== regulations.length}>Submit framework</button>
          </div>
        </div>
      </main>
    );
  }

  if (!current || !session) return null;

  return (
    <main>
      <div className="app-shell">
        <SiteHeader compact />
        <div className="progress-wrap">
          <div className="progress-meta">
            <span>Theme {index + 1} of {regulations.length}</span>
            <span className="progress-status">
              {autosaveState !== "idle" && (
                <span className={autosaveState === "error" ? "autosave-flag error" : "autosave-flag"}>
                  {autosaveState === "saving" ? "Saving…" : autosaveState === "saved" ? "Saved" : "Not saved"}
                </span>
              )}
              {completed} complete
            </span>
          </div>
          <div className="progress"><span style={{ width: `${(completed / regulations.length) * 100}%` }} /></div>
        </div>
        <section className="regulation-layout">
          <aside className="regulation-copy">
            <div className="regulation-title">
              <span>{String(current.number).padStart(2, "0")}</span>
              <div>
                <p className="eyebrow">Theme {current.number} of {regulations.length}</p>
                <h1>{current.title}</h1>
              </div>
            </div>
            <blockquote><GlossaryText text={current.text} /></blockquote>
            {current.provisions?.length ? (
              <ol className="provision-list">
                {current.provisions.map((provision, provisionIndex) => (
                  <li key={provisionIndex}>
                    <span aria-hidden="true">{current.number}.{provisionIndex + 1}</span>
                    <p><GlossaryText text={provision} /></p>
                  </li>
                ))}
              </ol>
            ) : null}
            <div className="evidence-card">
              <div className="evidence-heading">
                <span aria-hidden="true">◈</span>
                <div><small>Evidence snapshot</small><strong>Consider both sides</strong></div>
              </div>
              <EvidenceBars bars={current.evidenceBars} />
              <div className="evidence-point">
                <span>Why it may be needed</span>
                <p>{current.evidenceFor}</p>
              </div>
              <div className="evidence-point challenge">
                <span>Practical challenge</span>
                <p>{current.evidenceChallenge}</p>
              </div>
              <p className="data-note">{current.evidenceDataPoint}</p>
              <details>
                <summary>Sources &amp; further reading</summary>
                {current.sources.map((item) => <a href={item.url} target="_blank" rel="noreferrer" key={item.url}>{item.label} →</a>)}
              </details>
            </div>
          </aside>
          <section className="response-panel" aria-label={`Response to regulation ${current.number}`}>
            <div className="response-heading">
              <p className="eyebrow">{isMakeup ? "Your individual judgment" : "Your group’s judgment"}</p>
              <p>
                {isMakeup
                  ? "Give your own judgment for the whole theme. Pick one answer for A–C, up to three obstacles for D, and explain your reasoning in F."
                  : "Discuss first, then give one judgment for the whole theme. Pick one answer for A–C, and up to three obstacles for D."}
              </p>
            </div>
            <ChoiceGroup legend="A. Decision" value={response.decision} options={decisionLabels} onChange={(value) => update({ decision: value })} />
            <ChoiceGroup legend="B. International feasibility" value={response.feasibility} options={feasibilityLabels} onChange={(value) => update({ feasibility: value })} />
            <ChoiceGroup legend="C. Priority" value={response.priority} options={priorityLabels} onChange={(value) => update({ priority: value })} />
            <MultiChoiceGroup legend="D. Main obstacles" hint="Pick up to 3" values={response.obstacles || []} options={obstacleLabels} max={MAX_OBSTACLES} onToggle={toggleObstacle} />
            {response.obstacles?.includes("other") && <label>Describe the other obstacle<input value={response.otherObstacle || ""} onChange={(event) => update({ otherObstacle: event.target.value })} maxLength={100} /></label>}
            <label>
              E. Proposed revision <span className="optional">Optional</span>
              <textarea value={response.proposedRevision || ""} onChange={(event) => update({ proposedRevision: event.target.value })} placeholder="How would you rewrite this regulation?" rows={4} />
            </label>
            <label>
              F. Brief reasoning {isMakeup ? <span>Required</span> : <span className="optional">Optional</span>} · {response.reasoning?.length || 0}/300
              <textarea value={response.reasoning || ""} onChange={(event) => update({ reasoning: event.target.value })} placeholder={isMakeup ? "Explain your reasoning for this theme — required since you’re working individually." : "Briefly explain your decision."} maxLength={300} rows={3} />
            </label>
            {error && <p className="error" role="alert">{error}</p>}
            <div className="form-navigation">
              <button className="button secondary" disabled={index === 0} onClick={() => { setIndex((value) => value - 1); setError(""); flushAutosave(); window.scrollTo(0, 0); }}>← Back</button>
              <button className="button primary" onClick={next}>{index === regulations.length - 1 ? "Review responses" : "Save & continue →"}</button>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
