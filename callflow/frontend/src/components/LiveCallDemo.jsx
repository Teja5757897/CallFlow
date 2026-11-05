import { useEffect, useMemo, useState } from "react";
import Icon from "./Icon.jsx";

const TURNS = [
  { who: "bot", text: "Hi Priya, this is CallFlow calling for Smile Dental. Do you have a minute?" },
  { who: "user", text: "Sure, go ahead." },
  { who: "bot", text: "I can book your cleaning. Which weekday and which part of the day suits you?" },
  { who: "user", text: "Thursday afternoon works." },
  { who: "bot", text: "Booked: Thursday, 2:00 PM. A confirmation email is on its way. Thank you!" }
];

const BARS = Array.from({ length: 28 }, (_, i) => ({ delay: ((i * 137) % 100) / 100, dur: 0.9 + ((i * 53) % 60) / 100 }));

export default function LiveCallDemo() {
  const reduce = useMemo(() => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches, []);
  const [shown, setShown] = useState(reduce ? TURNS.length : 0);

  useEffect(() => {
    if (reduce) return undefined;
    const wait = shown < TURNS.length ? (shown === 0 ? 900 : 1700) : 5200;
    const t = setTimeout(() => setShown((s) => (s < TURNS.length ? s + 1 : 0)), wait);
    return () => clearTimeout(t);
  }, [shown, reduce]);

  const done = shown === TURNS.length;
  const seconds = String(Math.min(shown * 4, 59)).padStart(2, "0");

  return (
    <div className="demo" aria-label="Example of a call being booked">
      <div className="demo-head">
        <div className="demo-who">
          <span className="demo-avatar">P</span>
          <span>Priya Sharma<br /><small style={{ opacity: 0.6, fontWeight: 400 }}>+91 98•••• 3210</small></span>
        </div>
        <span className="demo-live"><i />{done ? "Call ended" : `Live · 00:${seconds}`}</span>
      </div>

      <div className="wave" aria-hidden="true" style={{ opacity: done ? 0.35 : 1 }}>
        {BARS.map((b, i) => (
          <span key={i} style={{ animationDelay: `-${b.delay}s`, animationDuration: `${b.dur}s`, animationPlayState: done ? "paused" : "running" }} />
        ))}
      </div>

      <div className="turns">
        {TURNS.slice(0, shown).map((t, i) => (
          <div key={i} className={`turn turn-${t.who}`}>
            <small>{t.who === "bot" ? "CallFlow agent" : "Customer"}</small>
            {t.text}
          </div>
        ))}
      </div>

      {done && (
        <div className="demo-result">
          <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}><Icon name="check" size={16} /> Confirmed · Thu afternoon</span>
          <span style={{ display: "inline-flex", gap: 6, alignItems: "center", fontSize: 12.5 }}><Icon name="mail" size={14} /> Email sent</span>
        </div>
      )}
      <p className="demo-foot">Sample call for illustration.</p>
    </div>
  );
}
