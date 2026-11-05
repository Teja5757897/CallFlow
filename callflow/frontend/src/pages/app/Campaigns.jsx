import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client.js";
import { useToast } from "../../context/ToastContext.jsx";
import Icon from "../../components/Icon.jsx";
import { useTitle } from "../../hooks.js";

const TEMPLATES = [
  { name: "Confirm appointment", goal: "Confirm the customer's upcoming appointment slot", blocks: ["Greeting and say why we are calling", "Offer available weekdays and morning or afternoon", "Handle a reschedule request", "Confirm the slot and say goodbye"] },
  { name: "Rebook missed visit", goal: "Rebook an appointment the customer missed", blocks: ["Greeting and acknowledge the missed visit kindly", "Offer new weekdays and morning or afternoon", "Confirm the new slot"] },
  { name: "Book a consultation", goal: "Book a free consultation with the customer", blocks: ["Greeting and introduce the consultation", "Ask which weekday and time of day suits them", "Confirm the booking and thank them"] }
];

const Q_TEMPLATES = [
  { name: "Customer feedback", goal: "Collect feedback after the customer's recent visit", blocks: ["Greeting and say why we are calling", "Thank them for their time at the end"], questions: [{ text: "On a scale of 1 to 5, how satisfied were you?", answer: "number" }, { text: "Would you recommend us to a friend?", answer: "yesno" }, { text: "Is there anything we could do better?", answer: "text" }] },
  { name: "Lead qualification", goal: "Find out whether the customer is interested in our service", blocks: ["Greeting and introduce the company", "Keep it short and friendly"], questions: [{ text: "Are you interested in our service?", answer: "yesno" }, { text: "What is your budget?", answer: "text" }, { text: "When are you planning to start?", answer: "text" }] },
  { name: "Event RSVP", goal: "Check whether the customer will attend our event", blocks: ["Greeting and mention the event"], questions: [{ text: "Will you attend the event?", answer: "yesno" }, { text: "How many people will come with you?", answer: "number" }] }
];

export default function Campaigns() {
  useTitle("Campaigns");
  const { push } = useToast();
  const [goal, setGoal] = useState(TEMPLATES[0].goal);
  const [blocks, setBlocks] = useState(TEMPLATES[0].blocks);
  const [tpl, setTpl] = useState(TEMPLATES[0].name);
  const [type, setType] = useState("booking");
  const [questions, setQuestions] = useState(Q_TEMPLATES[0].questions);
  const [leads, setLeads] = useState(null);
  const [history, setHistory] = useState(null);
  const [calls, setCalls] = useState([]);
  const [launching, setLaunching] = useState(false);
  const [result, setResult] = useState(null);

  function loadHistory() {
    api.getCampaigns().then(setHistory).catch(() => setHistory([]));
    api.getCalls().then(setCalls).catch(() => {});
  }
  useEffect(() => {
    api.getLeads().then(setLeads).catch(() => setLeads([]));
    loadHistory();
    const t = setInterval(loadHistory, 6000);
    return () => clearInterval(t);
  }, []);

  const consented = useMemo(() => (leads ?? []).filter((l) => l.consent).length, [leads]);
  const total = leads?.length ?? 0;
  const cleanBlocks = blocks.map((b) => b.trim()).filter(Boolean);

  function pick(t) { setTpl(t.name); setGoal(t.goal); setBlocks(t.blocks); if (t.questions) setQuestions(t.questions); }
  function switchType(next) {
    setType(next);
    const t = next === "questions" ? Q_TEMPLATES[0] : TEMPLATES[0];
    pick(t);
  }
  const cleanQuestions = questions.map((q) => ({ ...q, text: q.text.trim() })).filter((q) => q.text);
  const editQ = (i, patch) => { setTpl("Custom"); setQuestions((qs) => qs.map((q, j) => (j === i ? { ...q, ...patch } : q))); };
  const edit = (i, v) => { setTpl("Custom"); setBlocks((b) => b.map((x, j) => (j === i ? v : x))); };
  const remove = (i) => { setTpl("Custom"); setBlocks((b) => b.filter((_, j) => j !== i)); };
  const move = (i, d) => setBlocks((b) => {
    const j = i + d;
    if (j < 0 || j >= b.length) return b;
    const next = [...b];
    [next[i], next[j]] = [next[j], next[i]];
    return next;
  });

  async function launch() {
    if (!window.confirm(`Start calling ${consented} customer${consented === 1 ? "" : "s"} now?`)) return;
    setLaunching(true);
    setResult(null);
    try {
      const r = await api.startCampaign({ goal: goal.trim(), blocks: cleanBlocks, type, questions: cleanQuestions });
      setResult({ ok: true, r });
      push(`Campaign launched: ${r.queued} call${r.queued === 1 ? "" : "s"} queued.`);
      loadHistory();
    } catch (err) {
      setResult({ ok: false, message: err.message || "Couldn't launch the campaign." });
      push(err.message || "Couldn't launch the campaign.", "bad");
    } finally {
      setLaunching(false);
    }
  }

  const canLaunch = !launching && consented > 0 && goal.trim() && (type === "questions" ? cleanQuestions.length > 0 : cleanBlocks.length > 0);

  return (
    <>
      <div className="page-head">
        <div><h1>Campaigns</h1><p>Set the goal, shape the script and launch.</p></div>
      </div>

      <div className="two-col">
        <div className="card">
          <div className="type-switch" role="radiogroup" aria-label="Campaign type">
            <button type="button" role="radio" aria-checked={type === "booking"} className={`type-opt${type === "booking" ? " active" : ""}`} onClick={() => switchType("booking")}>
              <b>Book appointments</b><small>The agent agrees a weekday and time</small>
            </button>
            <button type="button" role="radio" aria-checked={type === "questions"} className={`type-opt${type === "questions" ? " active" : ""}`} onClick={() => switchType("questions")}>
              <b>Ask my own questions</b><small>Surveys, feedback, qualifying, reminders</small>
            </button>
          </div>

          <div className="field">
            <span className="label">Start from a template</span>
            <div className="chips">
              {(type === "questions" ? Q_TEMPLATES : TEMPLATES).map((t) => <button key={t.name} className={`chip${tpl === t.name ? " active" : ""}`} onClick={() => pick(t)}>{t.name}</button>)}
              {tpl === "Custom" && <span className="chip active">Custom</span>}
            </div>
          </div>

          <div className="field">
            <label className="label" htmlFor="goal">Call goal</label>
            <input id="goal" className="input" value={goal} onChange={(e) => { setGoal(e.target.value); setTpl("Custom"); }} />
            <span className="hint">{type === "questions" ? "Tell the agent what the call is about. It asks your questions below and records every answer." : "The agent also asks for a weekday (Mon to Fri) and morning or afternoon."}</span>
          </div>

          {type === "questions" && (
            <div style={{ marginBottom: 20 }}>
              <span className="label">Questions the agent will ask</span>
              <div style={{ marginTop: 8 }}>
                {questions.map((q, i) => (
                  <div className="q-row" key={i}>
                    <span className="block-num">{i + 1}</span>
                    <input className="input" value={q.text} onChange={(e) => editQ(i, { text: e.target.value })} placeholder="Type any question" aria-label={`Question ${i + 1}`} />
                    <select className="select" value={q.answer} onChange={(e) => editQ(i, { answer: e.target.value })} aria-label="Answer type">
                      <option value="text">Words</option><option value="yesno">Yes or no</option><option value="number">Number</option>
                    </select>
                    <button className="btn btn-ghost icon-btn btn-danger" onClick={() => { setTpl("Custom"); setQuestions((qs) => qs.filter((_, j) => j !== i)); }} aria-label="Remove question"><Icon name="trash" size={16} /></button>
                  </div>
                ))}
                <button className="btn btn-sm" disabled={questions.length >= 15} onClick={() => { setTpl("Custom"); setQuestions((qs) => [...qs, { text: "", answer: "text" }]); }}><Icon name="plus" size={15} /> Add question</button>
              </div>
            </div>
          )}

          <span className="label">{type === "questions" ? "Extra instructions (optional)" : "Script steps"}</span>
          <div style={{ marginTop: 8 }}>
            {blocks.map((b, i) => (
              <div className="block-row" key={i}>
                <span className="block-num">{i + 1}</span>
                <input className="input" value={b} onChange={(e) => edit(i, e.target.value)} aria-label={`Step ${i + 1}`} />
                <button className="btn btn-ghost icon-btn" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up"><Icon name="up" size={16} /></button>
                <button className="btn btn-ghost icon-btn" onClick={() => move(i, 1)} disabled={i === blocks.length - 1} aria-label="Move down"><Icon name="down" size={16} /></button>
                <button className="btn btn-ghost icon-btn btn-danger" onClick={() => remove(i)} aria-label="Remove step"><Icon name="trash" size={16} /></button>
              </div>
            ))}
            <button className="btn btn-sm" onClick={() => { setTpl("Custom"); setBlocks((b) => [...b, ""]); }}><Icon name="plus" size={15} /> Add step</button>
          </div>
        </div>

        <div className="card">
          <div className="chart-title" style={{ marginBottom: 10 }}>Ready to launch?</div>
          {leads === null ? <div className="skeleton" style={{ height: 80 }} /> : (
            <>
              <div className="summary-line"><span>Leads uploaded</span><b>{total}</b></div>
              <div className="summary-line"><span>Will be called (consent)</span><b>{consented}</b></div>
              <div className="summary-line"><span>Skipped (no consent)</span><b>{total - consented}</b></div>
              {type === "questions"
                ? <div className="summary-line"><span>Questions</span><b>{cleanQuestions.length}</b></div>
                : <div className="summary-line"><span>Script steps</span><b>{cleanBlocks.length}</b></div>}
            </>
          )}
          {leads !== null && total === 0 && (
            <div className="notice notice-info"><Icon name="users" size={16} /><span>No leads yet. <Link to="/leads" style={{ textDecoration: "underline" }}>Upload a CSV</Link> first.</span></div>
          )}
          {leads !== null && total > 0 && consented === 0 && (
            <div className="notice notice-bad"><span>Nobody has consent = yes, so no one can be called.</span></div>
          )}
          <button className="btn btn-primary btn-lg" style={{ width: "100%", marginTop: 6 }} disabled={!canLaunch} onClick={launch}>
            <Icon name="send" size={17} /> {launching ? "Launching…" : "Launch campaign"}
          </button>
          {result?.ok && (
            <div className="notice notice-ok" role="status">
              <span>
                {result.r.queued} call{result.r.queued === 1 ? "" : "s"} queued. Calls go out one at a time and unanswered ones are retried.
                {result.r.skippedNoConsent ? ` ${result.r.skippedNoConsent} skipped (no consent).` : ""}
                {result.r.skippedAlreadyActive ? ` ${result.r.skippedAlreadyActive} already queued.` : ""}
                {" "}<Link to="/dashboard" style={{ textDecoration: "underline" }}>Watch live</Link>
              </span>
            </div>
          )}
          {result && !result.ok && <div className="notice notice-bad" role="alert"><span>{result.message}</span></div>}
        </div>
      </div>

      <div className="section-title">Campaign history</div>
      {history === null ? <div className="skeleton" style={{ height: 70 }} /> : history.length === 0 ? (
        <div className="list"><div className="list-row" style={{ color: "var(--ink-3)" }}>No campaigns yet.</div></div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Goal</th><th>Started</th><th>Calls</th><th>Progress</th></tr></thead>
            <tbody>
              {history.map((c) => {
                const done = c.completed + c.no_answer + c.failed;
                return (
                  <tr key={c.id}>
                    <td><span className="primary">{c.goal}</span></td>
                    <td>{new Date(c.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</td>
                    <td>{c.total}</td>
                    <td>
                      <div className="progress" title={`${done} of ${c.total} finished`}>
                        <span style={{ width: `${c.total ? (c.completed / c.total) * 100 : 0}%`, background: "var(--ok)" }} />
                        <span style={{ width: `${c.total ? ((c.no_answer + c.failed) / c.total) * 100 : 0}%`, background: "var(--ink-3)" }} />
                        <span style={{ width: `${c.total ? (c.in_progress / c.total) * 100 : 0}%`, background: "var(--signal)" }} />
                      </div>
                      <span className="secondary">{done} of {c.total} finished</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="section-title">Call activity</div>
      {calls.length === 0 ? (
        <div className="list"><div className="list-row" style={{ color: "var(--ink-3)" }}>No calls yet. Start a campaign above.</div></div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Name</th><th>Phone</th><th>Status</th><th>Tries</th><th>What is happening</th></tr></thead>
            <tbody>
              {calls.map((c) => (
                <tr key={c.id}>
                  <td><span className="primary">{c.name}</span></td>
                  <td>{c.phone}</td>
                  <td><span className={`badge ${c.status === "completed" ? "badge-ok" : c.status === "failed" || c.status === "no_answer" ? "badge-bad" : "badge-neutral"}`}>{c.status.replace("_", " ")}</span></td>
                  <td>{c.attempts}</td>
                  <td style={{ maxWidth: 380, whiteSpace: "normal" }}>{c.note || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
