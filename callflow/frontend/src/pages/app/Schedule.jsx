import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client.js";
import { useTitle } from "../../hooks.js";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const SLOTS = [["10:00 AM", "Morning"], ["2:00 PM", "Afternoon"]];

export default function Schedule() {
  useTitle("Schedule");
  const [bookings, setBookings] = useState(null);
  useEffect(() => { api.getBookings().then(setBookings).catch(() => setBookings([])); }, []);

  const confirmed = useMemo(() => (bookings ?? []).filter((b) => b.status === "Confirmed" && b.day), [bookings]);
  const grid = useMemo(() => {
    const g = {};
    confirmed.forEach((b) => {
      const slot = SLOTS.find(([t]) => t === b.time)?.[0] ?? "other";
      const key = `${b.day}|${slot}`;
      (g[key] ??= []).push(b.name);
    });
    return g;
  }, [confirmed]);

  const max = Math.max(0, ...Object.values(grid).map((v) => v.length));
  const other = Object.entries(grid).filter(([k]) => k.endsWith("|other"));

  return (
    <>
      <div className="page-head">
        <div><h1>Schedule</h1><p>{bookings ? `${confirmed.length} confirmed booking${confirmed.length === 1 ? "" : "s"} this week's pattern.` : "Loading…"}</p></div>
        <div className="head-actions"><Link to="/bookings" className="btn">All bookings</Link></div>
      </div>

      {bookings === null ? <div className="skeleton" style={{ height: 260 }} /> : (
        <div className="card">
          <div className="week" role="table" aria-label="Weekly schedule">
            <div />
            {DAYS.map((d) => <div className="week-h" key={d}>{d}</div>)}
            {SLOTS.map(([time, label]) => (
              <FragmentRow key={time} time={time} label={label} grid={grid} max={max} />
            ))}
          </div>
          {other.length > 0 && <p className="hint" style={{ marginTop: 14 }}>Some bookings have a time outside 10:00 AM and 2:00 PM and aren't shown in the grid; find them under Bookings.</p>}
        </div>
      )}
      {bookings && confirmed.length === 0 && (
        <div className="notice notice-info">No confirmed bookings yet. When customers confirm a slot, it appears here.</div>
      )}
    </>
  );
}

function FragmentRow({ time, label, grid, max }) {
  return (
    <>
      <div className="week-label">{label}<br /><span className="hint">{time}</span></div>
      {DAYS.map((d) => {
        const names = grid[`${d}|${time}`] ?? [];
        const busy = max > 0 && names.length === max;
        return (
          <div key={d} className={`slot${busy ? " busy" : ""}`}>
            <span className="slot-count">{names.length}</span>
            <span className="slot-names">
              {names.slice(0, 4).map((n, i) => <span key={i}>{n}</span>)}
              {names.length > 4 && <span>+{names.length - 4} more</span>}
            </span>
          </div>
        );
      })}
    </>
  );
}
