import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client.js";
import { useAuth } from "../../api/AuthContext.jsx";
import Icon from "../../components/Icon.jsx";
import { STATUS_COLORS, STATUSES } from "../../status.js";
import { useTitle } from "../../hooks.js";

function elapsed(startedAt) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

const dayLetter = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", { weekday: "short" });

export default function Dashboard() {
  useTitle("Dashboard");
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);
  const [, tick] = useState(0);

  useEffect(() => {
    let alive = true;
    function load() {
      api.getDashboard()
        .then((d) => { if (alive) { setData(d); setFailed(false); } })
        .catch(() => alive && setFailed(true));
    }
    load();
    const poll = setInterval(load, 4000);
    const timer = setInterval(() => tick((t) => t + 1), 1000);
    return () => { alive = false; clearInterval(poll); clearInterval(timer); };
  }, []);

  const stats = data?.stats ?? { totalCalls: 0, ongoing: 0, booked: 0, conversion: "0%" };
  const daily = data?.daily ?? [];
  const outcomes = data?.outcomes ?? {};
  const outcomeTotal = STATUSES.reduce((n, s) => n + (outcomes[s] ?? 0), 0);
  const maxDay = Math.max(1, ...daily.map((d) => d.total));
  const first = user?.name?.split(" ")[0];

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{first ? `Hi ${first}` : "Dashboard"}</h1>
          <p>Here's what your calling looks like right now.</p>
        </div>
        <div className="head-actions"><Link to="/campaigns" className="btn btn-primary"><Icon name="send" size={16} /> New campaign</Link></div>
      </div>

      {failed && !data && <div className="notice notice-bad">Couldn't load the dashboard. Is the server running?</div>}

      <div className="stat-grid">
        {[
          ["Total calls", stats.totalCalls, "phone"],
          ["Ongoing now", stats.ongoing, "zap"],
          ["Successful", stats.booked, "calendar"],
          ["Conversion", stats.conversion, "chart"]
        ].map(([label, value, icon]) => (
          <div className="stat" key={label}>
            <div className="stat-top">{label}<span className="stat-icon"><Icon name={icon} size={17} /></span></div>
            <div className="stat-value">{data ? value : <span className="skeleton" style={{ display: "inline-block", width: 60, height: 30 }} />}</div>
          </div>
        ))}
      </div>

      <div className="dash-grid">
        <div className="card">
          <div className="chart-title">Last 7 days</div>
          <div className="chart-sub">Call results saved each day</div>
          <div className="bars" role="img" aria-label={`Results per day: ${daily.map((d) => `${dayLetter(d.date)} ${d.total}`).join(", ")}`}>
            {daily.map((d) => (
              <div className="bar-col" key={d.date}>
                <div className="bar-track" title={`${d.total} results, ${d.confirmed} confirmed`}>
                  <div className="bar-total" style={{ height: `${(d.total / maxDay) * 100}%` }} />
                  <div className="bar-confirmed" style={{ height: `${(d.confirmed / maxDay) * 100}%` }} />
                </div>
                {dayLetter(d.date)}
              </div>
            ))}
          </div>
          <div className="legend">
            <span><i style={{ background: "var(--brand)" }} />Confirmed</span>
            <span><i style={{ background: "var(--brand-soft)", border: "1px solid var(--line)" }} />All results</span>
          </div>
        </div>

        <div className="card">
          <div className="chart-title">Outcomes</div>
          <div className="chart-sub">{outcomeTotal ? `${outcomeTotal} calls with a result` : "No results yet"}</div>
          <div className="stack" aria-hidden="true">
            {STATUSES.map((s) => (outcomes[s] ? <span key={s} style={{ width: `${(outcomes[s] / outcomeTotal) * 100}%`, background: STATUS_COLORS[s] }} /> : null))}
          </div>
          <div className="outcome-list">
            {STATUSES.map((s) => (
              <div className="outcome-row" key={s}>
                <span><i style={{ background: STATUS_COLORS[s] }} />{s}</span>
                <b>{outcomes[s] ?? 0}</b>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="section-title">Calls in progress</div>
      <div className="list">
        {(data?.ongoingCalls ?? []).length === 0 && <div className="list-row" style={{ color: "var(--ink-3)" }}>No calls in progress right now.</div>}
        {(data?.ongoingCalls ?? []).map((c) => (
          <div className="list-row live-row" key={c.id}>
            <div className="live-head">
              <span><i className="live-dot" />{c.name} <span style={{ color: "var(--ink-3)" }}>· {c.phone}</span></span>
              <span className="timer">{elapsed(c.startedAt)}</span>
            </div>
            <div className="transcript live-transcript" aria-live="polite">
              {(c.live ?? []).length === 0
                ? <div className="secondary">Ringing or connecting. What is said will show here once the call is under way.</div>
                : c.live.map((t, i) => (
                    <div key={i} className={`t-turn ${t.speaker}`}>
                      <span className="t-who">{t.speaker === "bot" ? "AI" : "Customer"}</span>
                      <span>{t.text}</span>
                    </div>
                  ))}
            </div>
          </div>
        ))}
      </div>

      <div className="section-title">Recent calls <Link to="/bookings" className="btn btn-ghost btn-sm">View all</Link></div>
      <div className="list">
        {(data?.recentCalls ?? []).length === 0 && <div className="list-row" style={{ color: "var(--ink-3)" }}>No calls yet. Launch a campaign to get started.</div>}
        {(data?.recentCalls ?? []).map((c, i) => (
          <div className="list-row" key={i}>
            <span>{c.name} <span style={{ color: "var(--ink-3)" }}>· {c.label}</span></span>
            <span className={`badge badge-${c.tone}`}>{c.status}</span>
          </div>
        ))}
      </div>
    </>
  );
}
