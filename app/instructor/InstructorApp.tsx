"use client";
import { useMemo, useState } from "react";
import { SiteHeader } from "../components/SiteHeader";
import { firebaseAdminAction, firebaseAvailable, firebaseLoadAdmin, firebaseSignInInstructor } from "../lib/firebaseBackend";
import type { Regulation, Submission, SummitSession, Thresholds } from "../lib/types";

type Snapshot = { session: SummitSession; regulations: Regulation[]; submissions: Submission[] };

const thresholdLabels: Record<keyof Thresholds, string> = {
  consensusSupport: "Strong consensus: minimum support",
  consensusFeasibility: "Strong consensus: minimum feasibility",
  necessaryEssential: "Necessary but difficult: minimum essential",
  revisionNeeded: "Revision needed: minimum revise",
  contestedMinimum: "Contested: minimum opposing share",
  lowPriorityEssential: "Low priority: maximum essential",
  frameworkSupport: "Framework: minimum support",
  frameworkEssential: "Framework: minimum essential",
  frameworkRejectionMax: "Framework: maximum rejection",
};

export function InstructorApp() {
  const [email, setEmail] = useState(process.env.NEXT_PUBLIC_INSTRUCTOR_EMAIL || "");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("PEACE26");
  const [data, setData] = useState<Snapshot | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState("session");
  const [editing, setEditing] = useState<Regulation | null>(null);
  const [newCode, setNewCode] = useState("");
  // Edits in progress on the Thresholds tab, kept separate from `data` so an
  // unrelated reload triggered elsewhere (deleting a group, refreshing
  // status) never silently discards numbers the instructor hasn't saved yet.
  const [thresholdDraft, setThresholdDraft] = useState<Thresholds | null>(null);

  const headers = { "content-type": "application/json", "x-instructor-email": email, "x-instructor-password": password };

  async function load(nextCode = code) {
    if (nextCode !== code) setThresholdDraft(null);
    setBusy(true);
    setError("");
    try {
      let snapshot: Snapshot;
      if (firebaseAvailable()) {
        await firebaseSignInInstructor(email, password);
        snapshot = await firebaseLoadAdmin(nextCode);
      } else {
        const r = await fetch(`/api/admin?code=${nextCode}`, { headers: { "x-instructor-email": email, "x-instructor-password": password } });
        const x = await r.json();
        if (!r.ok) throw new Error(x.error);
        snapshot = x;
      }
      setCode(nextCode);
      setData(snapshot);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  }

  // Returns whether the action actually succeeded, so callers (thresholds,
  // the content editor) know it is safe to discard their local draft.
  async function action(body: Parameters<typeof firebaseAdminAction>[1], reload = true) {
    setBusy(true);
    setError("");
    try {
      if (firebaseAvailable()) await firebaseAdminAction(code, body);
      else {
        const r = await fetch("/api/admin", { method: "POST", headers, body: JSON.stringify({ code, ...body }) });
        const x = await r.json();
        if (!r.ok) throw new Error(x.error);
      }
      if (reload) await load();
      else setBusy(false);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed.");
      setBusy(false);
      return false;
    }
  }

  async function saveRegulation(event: React.FormEvent) {
    event.preventDefault();
    if (!editing) return;
    // Only close (and discard the working copy) once the save is confirmed —
    // otherwise a failed save would silently wipe out the instructor's edits.
    if (await action({ action: "regulation", regulation: editing })) setEditing(null);
  }

  function updateSource(index: number, patch: Partial<{ label: string; url: string }>) {
    setEditing((current) => (current ? { ...current, sources: current.sources.map((source, i) => (i === index ? { ...source, ...patch } : source)) } : current));
  }
  function addSource() {
    setEditing((current) => (current ? { ...current, sources: [...current.sources, { label: "", url: "" }] } : current));
  }
  function removeSource(index: number) {
    setEditing((current) => (current ? { ...current, sources: current.sources.filter((_, i) => i !== index) } : current));
  }
  function updateProvision(index: number, value: string) {
    setEditing((current) => (current ? { ...current, provisions: (current.provisions || []).map((p, i) => (i === index ? value : p)) } : current));
  }
  function addProvision() {
    setEditing((current) => (current ? { ...current, provisions: [...(current.provisions || []), ""] } : current));
  }
  function removeProvision(index: number) {
    setEditing((current) => (current ? { ...current, provisions: (current.provisions || []).filter((_, i) => i !== index) } : current));
  }

  function download(format: "json" | "csv") {
    if (!data) return;
    let content: string, type: string, name: string;
    if (format === "json") {
      content = JSON.stringify(data, null, 2);
      type = "application/json";
      name = `summit-${code}.json`;
    } else {
      const rows = [["group", "participants", "submitted", "updated", "regulation", "decision", "feasibility", "priority", "obstacles", "revision", "reasoning"]];
      data.submissions.forEach((s) =>
        data.regulations.forEach((r) => {
          const x = s.responses[r.id] || {};
          rows.push([s.groupName, s.participantNames || "", String(s.submitted), s.updatedAt, String(r.number), x.decision || "", x.feasibility || "", x.priority || "", (x.obstacles || []).join("; "), x.proposedRevision || "", x.reasoning || ""]);
        }),
      );
      content = rows.map((row) => row.map((v) => `"${v.replaceAll('"', '""')}"`).join(",")).join("\n");
      type = "text/csv";
      name = `summit-${code}.csv`;
    }
    const url = URL.createObjectURL(new Blob([content], { type }));
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }

  const submitted = useMemo(() => data?.submissions.filter((s) => s.submitted).length || 0, [data]);

  if (!data) {
    return (
      <main>
        <div className="app-shell">
          <SiteHeader />
          <section className="admin-login">
            <div>
              <p className="eyebrow">Instructor desk</p>
              <h1>Run the summit with confidence.</h1>
              <p>Open and close submissions, edit evidence, monitor groups, and export the class record.</p>
            </div>
            <form className="panel" onSubmit={(e) => { e.preventDefault(); load(); }}>
              <label>Session code<input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} /></label>
              <label>Instructor email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required /></label>
              <label>Instructor password<input type="password" value={password} autoComplete="current-password" onChange={(e) => setPassword(e.target.value)} required /></label>
              {error && <p className="error" role="alert">{error}</p>}
              <button className="button primary wide" disabled={busy}>{busy ? "Opening…" : "Open instructor desk"}</button>
              <p className="form-note">Only the configured instructor email is accepted. Your password is handled by Firebase when connected and is never stored in this app.</p>
            </form>
          </section>
        </div>
      </main>
    );
  }

  const thresholds = thresholdDraft ?? data.session.thresholds;

  return (
    <main>
      <div className="admin-shell">
        <SiteHeader compact />
        <header className="admin-head">
          <div>
            <p className="eyebrow">Instructor desk · {code}</p>
            <h1>{data.session.title}</h1>
          </div>
          <div className="admin-head-actions">
            <a className="admin-head-link" href={`/dashboard?code=${code}`} target="_blank" rel="noreferrer">Open live dashboard ↗</a>
            <div className={`session-state ${data.session.status}`}>{data.session.status === "open" ? "● Submissions open" : "○ Submissions closed"}</div>
          </div>
        </header>
        <nav className="admin-tabs" aria-label="Instructor sections">
          {["session", "groups", "content", "thresholds"].map((x) => (
            <button className={tab === x ? "active" : ""} key={x} onClick={() => setTab(x)}>{x[0].toUpperCase() + x.slice(1)}</button>
          ))}
        </nav>
        {error && <p className="error centered">{error}</p>}

        {tab === "session" && (
          <section className="admin-grid">
            <div className="panel">
              <p className="eyebrow">Live controls</p>
              <h2>{submitted} groups submitted</h2>
              <p>{data.submissions.length - submitted} saved draft{data.submissions.length - submitted === 1 ? "" : "s"}</p>
              <button className={`button ${data.session.status === "open" ? "danger" : "primary"}`} onClick={() => action({ action: "session", status: data.session.status === "open" ? "closed" : "open" })}>
                {data.session.status === "open" ? "Close submissions" : "Open submissions"}
              </button>
              <button className="button secondary" onClick={() => load()}>Refresh status</button>
            </div>
            <div className="panel">
              <p className="eyebrow">Create another session</p>
              <label>New short code<input value={newCode} onChange={(e) => setNewCode(e.target.value.toUpperCase())} placeholder="e.g. JULY26" maxLength={10} /></label>
              <button className="button secondary" onClick={async () => { await action({ action: "create", code: newCode }, false); if (newCode) { await load(newCode); setNewCode(""); } }}>Create &amp; open</button>
            </div>
            <div className="panel">
              <p className="eyebrow">Class record</p>
              <h2>Export responses</h2>
              <div className="button-row">
                <button className="button secondary" onClick={() => download("csv")}>Download CSV</button>
                <button className="button secondary" onClick={() => download("json")}>Download JSON</button>
              </div>
              <button className="text-danger" onClick={() => { if (confirm("Delete every response in this session? This cannot be undone.")) action({ action: "reset" }); }}>Reset this session</button>
            </div>
          </section>
        )}

        {tab === "groups" && (
          <section className="admin-section">
            <div className="section-heading">
              <div>
                <h2>Submitted groups</h2>
                <p>{firebaseAvailable() ? "Release a group stuck on a lost or replaced device so they can rejoin from a new one — their answers stay. Delete only accidental duplicates or test entries." : "Delete only accidental duplicates or test entries."}</p>
              </div>
              <button className="button secondary" onClick={() => load()}>Refresh</button>
            </div>
            <div className="group-table">
              {data.submissions.length ? data.submissions.map((s) => (
                <div key={s.id}>
                  <span className={s.submitted ? "status complete" : "status"}>{s.submitted ? "Submitted" : "Draft"}</span>
                  <strong>{s.groupName}</strong>
                  <span>{s.participantNames || "Names not provided"}</span>
                  <time>{new Date(s.updatedAt).toLocaleString()}</time>
                  <div className="group-actions">
                    {firebaseAvailable() && (
                      <button
                        className="release"
                        title="Frees this group's name so they can rejoin from a different device. Their saved answers are kept."
                        onClick={() => { if (confirm(`Release ${s.groupName} so they can rejoin from a different device? Their saved answers are kept.`)) action({ action: "release", submissionId: s.id }); }}
                      >
                        Release
                      </button>
                    )}
                    <button className="danger" onClick={() => { if (confirm(`Delete ${s.groupName}'s response? This cannot be undone.`)) action({ action: "delete", submissionId: s.id }); }}>Delete</button>
                  </div>
                </div>
              )) : <p className="empty-inline">No groups have joined this session yet.</p>}
            </div>
          </section>
        )}

        {tab === "content" && (
          <section className="admin-section">
            <div className="section-heading">
              <div>
                <h2>Themes &amp; evidence</h2>
                <p>Edit everything students see for a theme here — the summary, its numbered rules, and the evidence. Changes apply to every session.</p>
              </div>
            </div>
            <div className="content-list">
              {data.regulations.map((r) => (
                <button key={r.id} onClick={() => setEditing({ ...r, sources: r.sources.map((s) => ({ ...s })), provisions: [...(r.provisions || [])] })}>
                  <span>{String(r.number).padStart(2, "0")}</span>
                  <div><strong>{r.title}</strong><small>{r.text}</small></div>
                  <em>Edit →</em>
                </button>
              ))}
            </div>
          </section>
        )}

        {tab === "thresholds" && (
          <section className="admin-section narrow">
            <div className="section-heading">
              <div>
                <h2>Dashboard classifications</h2>
                <p>Percentages are transparent and session-specific. Categories are evaluated from top to bottom.</p>
              </div>
            </div>
            <div className="threshold-grid">
              {Object.entries(thresholds).map(([key, value]) => (
                <label key={key}>
                  {thresholdLabels[key as keyof Thresholds]}
                  <span><input type="number" min={0} max={100} value={value} onChange={(e) => setThresholdDraft({ ...thresholds, [key]: Number(e.target.value) })} />%</span>
                </label>
              ))}
            </div>
            <button className="button primary" onClick={async () => { if (await action({ action: "session", thresholds })) setThresholdDraft(null); }}>Save thresholds</button>
            {thresholdDraft && <span className="unsaved-hint">Unsaved changes</span>}
          </section>
        )}

        {editing && (
          <div className="modal-backdrop">
            <form className="detail-modal edit-modal" onSubmit={saveRegulation}>
              <button type="button" className="modal-close" onClick={() => setEditing(null)}>×</button>
              <p className="eyebrow">Theme {editing.number}</p>
              <label>Short title<input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></label>
              <label>Theme summary (one line)<textarea rows={2} value={editing.text} onChange={(e) => setEditing({ ...editing, text: e.target.value })} /></label>

              <div className="field-block">
                <p className="field-label">Numbered rules students see <span className="optional">Shown as {editing.number}.1, {editing.number}.2 …</span></p>
                {(editing.provisions || []).map((p, i) => (
                  <div className="edit-row" key={i}>
                    <textarea rows={2} value={p} onChange={(e) => updateProvision(i, e.target.value)} />
                    <button type="button" onClick={() => removeProvision(i)} disabled={(editing.provisions || []).length <= 1} aria-label={`Remove rule ${i + 1}`}>×</button>
                  </div>
                ))}
                <button type="button" className="button secondary small" onClick={addProvision}>+ Add another rule</button>
              </div>

              <label>Why it may be needed<textarea rows={3} value={editing.evidenceFor} onChange={(e) => setEditing({ ...editing, evidenceFor: e.target.value })} /></label>
              <label>Practical challenge<textarea rows={3} value={editing.evidenceChallenge} onChange={(e) => setEditing({ ...editing, evidenceChallenge: e.target.value })} /></label>
              <label>Data point / verification note<textarea rows={2} value={editing.evidenceDataPoint} onChange={(e) => setEditing({ ...editing, evidenceDataPoint: e.target.value })} /></label>

              <div className="field-block">
                <p className="field-label">Sources</p>
                {editing.sources.map((s, i) => (
                  <div className="edit-row" key={i}>
                    <div className="edit-row-fields">
                      <input placeholder="Source label" value={s.label} onChange={(e) => updateSource(i, { label: e.target.value })} />
                      <input placeholder="https://…" type="url" value={s.url} onChange={(e) => updateSource(i, { url: e.target.value })} />
                    </div>
                    <button type="button" onClick={() => removeSource(i)} disabled={editing.sources.length <= 1} aria-label={`Remove source ${i + 1}`}>×</button>
                  </div>
                ))}
                <button type="button" className="button secondary small" onClick={addSource}>+ Add another source</button>
              </div>

              {error && <p className="error" role="alert">{error}</p>}
              <button className="button primary" disabled={busy}>Save theme</button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
