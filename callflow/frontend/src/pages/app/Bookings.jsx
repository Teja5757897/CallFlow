import { Fragment, useEffect, useMemo, useState } from "react";
import { api } from "../../api/client.js";
import Icon from "../../components/Icon.jsx";
import { STATUSES, STATUS_TONE } from "../../status.js";
import { useTitle } from "../../hooks.js";

const FILTERS = ["All", ...STATUSES];

export default function Bookings() {
  useTitle("Results");
  const [bookings, setBookings] = useState(null);
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState(null);
  const [details, setDetails] = useState({});

  useEffect(() => { api.getBookings().then(setBookings).catch(() => setBookings([])); }, []);

  async function toggle(id) {
    if (openId === id) return setOpenId(null);
    setOpenId(id);
    if (!details[id]) {
      try {
        const d = await api.getBooking(id);
        setDetails((p) => ({ ...p, [id]: d }));
      } catch {
        setDetails((p) => ({ ...p, [id]: { transcript: [], error: true } }));
      }
    }
  }

  const counts = useMemo(() => {
    const c = { All: bookings?.length ?? 0 };
    (bookings ?? []).forEach((b) => { c[b.status] = (c[b.status] ?? 0) + 1; });
    return c;
  }, [bookings]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (bookings ?? []).filter((b) => (filter === "All" || b.status === filter) && (!q || b.name.toLowerCase().includes(q) || b.phone.includes(q)));
  }, [bookings, filter, query]);

  return (
    <>
      <div className="page-head">
        <div><h1>Results</h1><p>Every call result: bookings, answers, summary and transcript.</p></div>
        <div className="head-actions"><a className="btn" href={api.exportUrl}><Icon name="download" size={16} /> Export CSV</a></div>
      </div>

      <div className="toolbar">
        <div className="search">
          <Icon name="search" size={16} />
          <input className="input" placeholder="Search name or phone" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search results" />
        </div>
      </div>
      <div className="chips" style={{ marginBottom: 16 }}>
        {FILTERS.map((f) => <button key={f} className={`chip${filter === f ? " active" : ""}`} onClick={() => setFilter(f)}>{f} ({counts[f] ?? 0})</button>)}
      </div>

      {bookings === null ? <div className="skeleton" style={{ height: 160 }} /> : visible.length === 0 ? (
        <div className="card empty"><strong>Nothing here yet</strong>{filter === "All" ? "Results appear once campaigns start calling." : `No ${filter.toLowerCase()} results.`}</div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Customer</th><th>Outcome</th><th>Updated</th><th>Status</th><th>Email</th><th /></tr></thead>
            <tbody>
              {visible.map((b) => (
                <Fragment key={b.id}>
                  <tr>
                    <td><span className="primary">{b.name}</span><span className="secondary">{b.phone}</span></td>
                    <td>
                      {b.answers?.length > 0
                        ? <><span className="primary">{b.answers.length} answer{b.answers.length === 1 ? "" : "s"}</span><span className="secondary">Open Details to read</span></>
                        : <><span className="primary">{b.day ?? "—"}</span><span className="secondary">{b.time ?? "Not selected"}</span></>}
                    </td>
                    <td>{b.bookedOn}</td>
                    <td>
                      <span className={`badge badge-${STATUS_TONE[b.status] ?? "warn"}`}>{b.status}</span>
                      {b.attempts > 1 && <span className="secondary">{b.attempts} attempts</span>}
                    </td>
                    <td>{b.emailSent ? <span className="badge badge-brand">Sent</span> : <span style={{ color: "var(--ink-3)" }}>—</span>}</td>
                    <td style={{ textAlign: "right" }}><button className="btn btn-sm" onClick={() => toggle(b.id)}>{openId === b.id ? "Hide" : "Details"}</button></td>
                  </tr>
                  {openId === b.id && (
                    <tr className="detail-row">
                      <td colSpan={6}>
                        <div><b>Summary:</b> {b.summary ?? "No summary available."}</div>
                        {b.costPaise != null && <div className="hint" style={{ marginTop: 4 }}>Call cost: <b>₹{(b.costPaise / 100).toFixed(2)}</b> ({b.seconds} seconds)</div>}
                        {b.answers?.length > 0 && (
                          <div className="answers">
                            {b.answers.map((a, i) => <div key={i} className="answer-row"><span>{a.question}</span><b>{a.answer}</b></div>)}
                          </div>
                        )}
                        {!details[b.id] && <div className="secondary" style={{ marginTop: 8 }}>Loading transcript…</div>}
                        {details[b.id]?.transcript?.length === 0 && <div className="secondary" style={{ marginTop: 8 }}>No transcript was recorded for this call. It may not have been answered, or the call result has not arrived yet.</div>}
                        {details[b.id]?.transcript?.length > 0 && (
                          <div className="transcript">
                            {details[b.id].transcript.map((t, i) => (
                              <div key={i} className={`t-turn ${t.speaker}`}>
                                <span className="t-who">{t.speaker === "bot" ? "AI" : "Customer"}</span>
                                <span>{t.text}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
