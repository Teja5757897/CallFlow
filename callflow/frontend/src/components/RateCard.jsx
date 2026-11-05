import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import Icon from "./Icon.jsx";
import { RATES, RATES_REGION, ONE_SHOT, GOAL, callCost, usd } from "../data/plans.js";

// CALL-E's pay-as-you-go rates, with a cost calculator.
// onStart runs when the button is pressed; buttonText/busy control the button.
export default function RateCard({ onStart, buttonText = "Start free trial", busy = false, disabled = false }) {
  const [fx, setFx] = useState(null);
  useEffect(() => { api.getPayConfig().then((c) => setFx(c.usdToInr * (1 + (c.markupPercent || 0) / 100))).catch(() => {}); }, []);
  const inr = (usd) => fx ? ` (about ₹${(usd * fx).toLocaleString("en-IN", { maximumFractionDigits: 2 })})` : "";
  const [seconds, setSeconds] = useState(30);
  const [calls, setCalls] = useState(100);

  const one = callCost(ONE_SHOT, seconds);
  const goal = callCost(GOAL, seconds);
  const saved = one.total - goal.total;
  const pct = Math.round((saved / one.total) * 100);
  const bar = (c, max) => ({ model: (c.model / max) * 100, carrier: (c.carrier / max) * 100 });
  const bOne = bar(one, one.total), bGoal = bar(goal, one.total);
  const mins = Math.floor(seconds / 60), secs = seconds % 60;
  const lenText = mins ? `${mins} min${secs ? ` ${secs} sec` : ""}` : `${secs} seconds`;

  return (
    <div className="rates">
      <div className="rate-hero">
        <div>
          <span className="eyebrow">Pay as you go</span>
          <h2>Pay only for the calls you make</h2>
          <p>No monthly fee. Every call is charged by its length: a model fee for each 10 seconds plus a carrier fee for each minute.</p>
        </div>
        <div className="rate-save"><small>Goal calls save</small><b>{pct}<span>%</span></b><small>vs One-shot-call</small></div>
      </div>

      <div className="calc">
        <div className="calc-head"><b>{lenText} call</b><span>{RATES_REGION}</span></div>

        <div className="calc-controls">
          <label>Call length: <b>{lenText}</b>
            <input type="range" min="10" max="300" step="10" value={seconds} onChange={(e) => setSeconds(Number(e.target.value))} />
          </label>
          <label>Number of calls: <b>{calls.toLocaleString("en-US")}</b>
            <input type="range" min="1" max="2000" step="1" value={calls} onChange={(e) => setCalls(Number(e.target.value))} />
          </label>
        </div>

        <div className="calc-row">
          <div className="calc-label"><span>One-shot-call</span><b>{usd(one.total)}</b></div>
          <div className="calc-bar"><i className="m" style={{ width: `${bOne.model}%` }} /><i className="c" style={{ width: `${bOne.carrier}%` }} /></div>
        </div>
        <div className="calc-row goal">
          <div className="calc-label"><span>Goal <em className="badge badge-ok">Half price</em></span><b>{usd(goal.total)}</b></div>
          <div className="calc-bar"><i className="m" style={{ width: `${bGoal.model}%` }} /><i className="c" style={{ width: `${bGoal.carrier}%` }} /></div>
          <div className="calc-save">You save {usd(saved)} per call</div>
        </div>
        <div className="legend"><span><i className="m" /> Model fee, per 10 seconds</span><span><i className="c" /> Carrier fee, per minute</span></div>

        <div className="calc-total">
          <span>{calls.toLocaleString("en-US")} Goal calls of {lenText}</span>
          <b>{usd(goal.total * calls, 2)}<small>{inr(goal.total * calls)}</small></b>
        </div>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Direction</th><th>Mode</th><th>Model fee / 10 seconds</th><th>Carrier fee / minute</th></tr></thead>
          <tbody>
            {RATES.map((r) => (
              <tr key={r.direction + r.mode}>
                <td><span className="primary">{r.direction}</span></td>
                <td>{r.mode}{r.half && <> <span className="badge badge-ok">Half price</span></>}</td>
                <td>{usd(r.model)}</td><td>{usd(r.carrier)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="hint rate-note">Outbound supports One-shot-call and Goal. Inbound supports Goal only. These are CALL-E's rates for US and Canada calls in US dollars, and rates for other countries may differ. These costs are estimates; your real bill follows the length of each call.</p>

      {onStart && (
        <div className="rate-cta">
          <button type="button" className="btn btn-primary btn-lg" onClick={onStart} disabled={busy || disabled}>{busy ? "Please wait…" : buttonText} <Icon name="arrow" size={17} /></button>
        </div>
      )}
    </div>
  );
}
