import { useEffect, useMemo, useState } from "react";
import { api } from "../../api/client.js";
import { useAuth } from "../../api/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import Icon from "../../components/Icon.jsx";
import { useTitle } from "../../hooks.js";

// Default start: the next full hour, in the browser's local time, as the value a datetime-local input expects.
function nextHour() {
  const d = new Date();
  d.setHours(d.getHours() + 1, 0, 0, 0);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:00`;
}

const MEET_RE = /^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}/i;

export default function Meetings() {
  useTitle("Meetings");
  const { user } = useAuth();
  const { push } = useToast();

  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [startsAt, setStartsAt] = useState(nextHour);
  const [duration, setDuration] = useState(30);
  const [note, setNote] = useState("");
  const [picked, setPicked] = useState([]);
  const [extra, setExtra] = useState("");
  const [search, setSearch] = useState("");
  const [leads, setLeads] = useState([]);
  const [past, setPast] = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    api.getLeads().then(setLeads).catch(() => setLeads([]));
    api.getMeetings().then(setPast).catch(() => setPast([]));
  }, []);

  const withEmail = useMemo(() => leads.filter((l) => l.email), [leads]);
  const shown = withEmail.filter((l) => `${l.name} ${l.email}`.toLowerCase().includes(search.toLowerCase()));
  const toggle = (email) => setPicked((p) => (p.includes(email) ? p.filter((e) => e !== email) : [...p, email]));
  const extraList = extra.split(/[,;\s]+/).map((e) => e.trim()).filter(Boolean);
  const total = new Set([...picked, ...extraList.map((e) => e.toLowerCase())]).size;
  const linkLooksWrong = link && !MEET_RE.test(link.trim());

  async function submit(e) {
    e.preventDefault();
    setError(""); setResult(null);
    const when = new Date(startsAt);
    if (Number.isNaN(when.getTime())) return setError("Choose a date and time.");
    setSending(true);
    try {
      const whenText = when.toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" });
      const r = await api.sendInvite({
        title, link: link.trim(), startsAt: when.toISOString(), whenText, durationMin: Number(duration), note,
        recipients: [...picked, ...extraList]
      });
      setResult(r);
      push(`Invite sent to ${r.sent.length} ${r.sent.length === 1 ? "person" : "people"}.`);
      api.getMeetings().then(setPast).catch(() => {});
    } catch (err) {
      setError(err.message || "Couldn't send the invite.");
    } finally {
      setSending(false);
    }
  }

  async function testEmail() {
    setChecking(true);
    try { const r = await api.checkEmail(); push(r.message); } catch (err) { push(err.message, "bad"); } finally { setChecking(false); }
  }

  return (
    <>
      <div className="page-head">
        <div><h1>Meetings</h1><p>Email a face-to-face meeting invite with a Google Meet link.</p></div>
        <div className="head-actions">
          {<button className="btn" onClick={testEmail} disabled={checking}><Icon name="mail" size={16} /> {checking ? "Checking…" : "Test email settings"}</button>}
          <a className="btn btn-primary" href="https://meet.google.com/new" target="_blank" rel="noreferrer"><Icon name="video" size={16} /> Create a Meet link</a>
        </div>
      </div>


      <div className="two-col">
        <form className="card" onSubmit={submit}>
          <h3 style={{ marginBottom: 16 }}>New invite</h3>
          <div className="field">
            <label className="label" htmlFor="m-title">Meeting title</label>
            <input id="m-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Weekly bookings review" maxLength={120} />
          </div>
          <div className="field">
            <label className="label" htmlFor="m-link">Google Meet link</label>
            <input id="m-link" className="input" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://meet.google.com/abc-defg-hij" />
            <span className="hint">Press "Create a Meet link" above, start the meeting, then paste its link here. Zoom or Teams links also work.</span>
            {linkLooksWrong && <span className="hint" style={{ color: "var(--warn)" }}>This does not look like a Google Meet link, but it will be sent as written.</span>}
          </div>
          <div className="add-form" style={{ gridTemplateColumns: "1.6fr 1fr", marginBottom: 16 }}>
            <div className="field">
              <label className="label" htmlFor="m-when">Date and time</label>
              <input id="m-when" type="datetime-local" className="input" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
            </div>
            <div className="field">
              <label className="label" htmlFor="m-dur">Length</label>
              <select id="m-dur" className="select" value={duration} onChange={(e) => setDuration(e.target.value)}>
                {[15, 30, 45, 60, 90].map((m) => <option key={m} value={m}>{m} minutes</option>)}
              </select>
            </div>
          </div>
          <div className="field">
            <label className="label" htmlFor="m-note">Message (optional)</label>
            <textarea id="m-note" className="textarea" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Please bring last week's numbers." maxLength={1000} />
          </div>

          <div className="field">
            <label className="label">Who to invite</label>
            {withEmail.length > 0 ? (
              <>
                <input className="input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search your leads with an email address" />
                <div className="pick-list">
                  {shown.map((l) => (
                    <label key={l._id} className="pick-row">
                      <input type="checkbox" checked={picked.includes(l.email.toLowerCase())} onChange={() => toggle(l.email.toLowerCase())} />
                      <span><b>{l.name}</b><small>{l.email}</small></span>
                    </label>
                  ))}
                  {shown.length === 0 && <p className="hint" style={{ padding: 10 }}>No one matches.</p>}
                </div>
              </>
            ) : <span className="hint">None of your leads has an email yet. Type addresses below.</span>}
          </div>
          <div className="field">
            <label className="label" htmlFor="m-extra">Other email addresses</label>
            <input id="m-extra" className="input" value={extra} onChange={(e) => setExtra(e.target.value)} placeholder="ops@company.com, team@company.com" />
            <span className="hint">Separate several addresses with commas. Each person gets their own email.</span>
          </div>

          {error && <div className="form-error" role="alert">{error}</div>}
          {result && (
            <div className={`notice ${result.failed.length ? "notice-bad" : "notice-ok"}`} role="status">
              <Icon name={result.failed.length ? "x" : "check"} size={16} />
              <span>Sent to {result.sent.length}. {result.failed.length ? `Failed for ${result.failed.map((f) => f.email).join(", ")}: ${result.failed[0].error}` : "Everyone has the link and a calendar invite."}</span>
            </div>
          )}
          <button className="btn btn-primary btn-lg" disabled={sending || !title.trim() || !link.trim() || total === 0}>
            <Icon name="send" size={17} /> {sending ? "Sending…" : `Send invite${total ? ` to ${total}` : ""}`}
          </button>
        </form>

        <div className="stack-col">
          <div className="card">
            <h3 style={{ marginBottom: 6 }}>What they receive</h3>
            <p className="hint" style={{ marginBottom: 14 }}>A clear email with a Join button, the time in your time zone, and a calendar file that adds the meeting to Google Calendar, Outlook or Apple Calendar.</p>
            <div className="mock">
              <div className="mock-title">{title || "Weekly bookings review"}</div>
              <div className="mock-row"><span>{startsAt ? new Date(startsAt).toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "Pick a time"}</span><span className="badge badge-neutral">{duration} min</span></div>
              <div className="mock-row"><span className="hint">{note || "Your message appears here."}</span></div>
              <div style={{ marginTop: 10 }}><span className="btn btn-primary btn-sm"><Icon name="video" size={14} /> Join the meeting</span></div>
            </div>
          </div>

          {(
            <div className="card">
              <h3 style={{ marginBottom: 10 }}>Sent invites</h3>
              {past === null ? <div className="skeleton" style={{ height: 60 }} /> : past.length === 0 ? (
                <p className="hint">Nothing sent yet.</p>
              ) : (
                <div className="list" style={{ border: 0 }}>
                  {past.slice(0, 6).map((m) => (
                    <div key={m.id} className="list-row" style={{ padding: "12px 0" }}>
                      <div style={{ minWidth: 0 }}>
                        <b style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.title}</b>
                        <small className="hint">{m.whenText || new Date(m.startsAt).toLocaleString()} · {m.sent.length} sent{m.failed.length ? `, ${m.failed.length} failed` : ""}</small>
                      </div>
                      <a className="btn btn-sm" href={m.link} target="_blank" rel="noreferrer">Open</a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
