import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../api/client.js";
import { useAuth } from "../../api/AuthContext.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import Icon from "../../components/Icon.jsx";
import { useTitle } from "../../hooks.js";

export default function Settings() {
  useTitle("Settings");
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const { push } = useToast();
  const navigate = useNavigate();
  const [plan, setPlanState] = useState(null);
  const setPlan = (p) => { setPlanState(p); window.dispatchEvent(new Event("plan-changed")); };
  const [apiKey, setApiKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [keyError, setKeyError] = useState("");

  useEffect(() => { api.getPlan().then(setPlanState).catch(() => {}); }, []);

  const [showKey, setShowKey] = useState(false);
  const [system, setSystem] = useState(null);
  useEffect(() => { api.getSystem().then(setSystem).catch(() => {}); }, []);
  async function saveKey(e) {
    e.preventDefault();
    setKeyError(""); setBusy(true);
    try {
      const r = await api.saveKey(apiKey.trim());
      setPlan(r); setApiKey("");
      push(r.warning || "Your CALL-E key is saved.");
    } catch (err) { setKeyError(err.message); } finally { setBusy(false); }
  }
  async function removeKey() {
    try { setPlan(await api.removeKey()); push("Back to the shared account."); } catch (err) { push(err.message, "bad"); }
  }
  async function clearLeads() {
    if (!window.confirm("Delete ALL your leads? This cannot be undone.")) return;
    try {
      const r = await api.clearLeads();
      push(`${r.deleted ?? 0} lead${r.deleted === 1 ? "" : "s"} deleted.`);
    } catch (err) {
      push(err.message, "bad");
    }
  }

  async function out() { await logout(); navigate("/login"); }

  return (
    <>
      <div className="page-head"><div><h1>Settings</h1><p>Your account and preferences.</p></div></div>
      <div className="settings-grid">
        <div className="card">
          <div className="chart-title" style={{ marginBottom: 8 }}>Account</div>
          <div className="kv"><span>Name</span><b>{user?.name}</b></div>
          <div className="kv"><span>Email</span><b>{user?.email}</b></div>
        </div>

        <div className="card" id="plan">
          <div className="chart-title" style={{ marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Your plan</span>
            {plan && <span className={`badge ${plan.trialEnded ? "badge-bad" : plan.plan === "paid" ? "badge-ok" : "badge-neutral"}`}>{plan.trialEnded ? "Trial finished" : plan.plan === "paid" ? "Paid" : "Free trial"}</span>}
          </div>

          {plan?.mock && <div className="notice notice-info"><Icon name="shield" size={16} /><span>Test mode is on: calls are simulated and never use up your trial.</span></div>}

          {plan && plan.callsLeft !== null && !plan.mock && (
            <>
              <div className="kv"><span>Free calls used</span><b>{plan.callsUsed} of {plan.callsLimit}</b></div>
              <div className="meter" aria-hidden="true"><i style={{ width: `${Math.min(100, (plan.callsUsed / plan.callsLimit) * 100)}%` }} /></div>
            </>
          )}
          {plan && plan.callsLeft === null && !plan.mock && <p className="hint">Unlimited calls on your plan.</p>}

          {plan?.trialEnded && (
            <div className="notice notice-bad">
              <Icon name="x" size={16} />
              <span>Your free trial is finished, so calls are paused. Add money and your waiting calls continue automatically.</span>
            </div>
          )}

          <div className="head-actions" style={{ marginTop: 12 }}>
            <Link className="btn btn-primary" to="/billing">{plan?.walletEnabled ? "Billing" : "Add money"}</Link>
            <button type="button" className="btn" onClick={() => setShowKey((v) => !v)}>{showKey ? "Hide advanced" : "Advanced"}</button>
          </div>

          {showKey && (
            <form onSubmit={saveKey} style={{ marginTop: 14 }}>
              <p className="hint" style={{ marginBottom: 8 }}>You do not need this. Calls already run on CallFlow's own CALL-E account. Only fill it in if you want calls to use your own CALL-E account.</p>
              {plan?.source === "own" && <div className="kv"><span>Your CALL-E key</span><b>{plan.keyHint}</b></div>}
              <label className="label" htmlFor="calle-key">Your own CALL-E API key (optional)</label>
              <input id="calle-key" className="input" type="password" autoComplete="off" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Paste a key from your CALL-E dashboard" />
              {keyError && <div className="form-error" role="alert">{keyError}</div>}
              <div className="head-actions" style={{ marginTop: 12 }}>
                <button className="btn" disabled={busy || apiKey.trim().length < 20}>{busy ? "Checking…" : "Save key"}</button>
                {plan?.source === "own" && <button type="button" className="btn" onClick={removeKey}>Use the shared account</button>}
              </div>
            </form>
          )}
        </div>

        {system && (
          <div className="card">
            <div className="chart-title" style={{ marginBottom: 8 }}>System status</div>
            <p className="hint" style={{ marginBottom: 10 }}>What this server read from its environment settings. To change any of it, edit the environment variables on your host and restart.</p>
            {[
              ["Calls", system.callsMode, system.callsOk],
              ["Payments", system.payments, system.paymentsOk],
              ["Email", system.email, system.emailOk],
              ["Public address", system.publicUrl, system.publicUrlOk],
              ["Webhook secret", system.webhookSecretOk ? "Set" : "Missing", system.webhookSecretOk]
            ].map(([k, v, good]) => (
              <div className="kv" key={k}><span>{k}</span><b style={{ color: good ? "var(--ok)" : "var(--bad)", textAlign: "right" }}>{v}</b></div>
            ))}
            <div className="kv"><span>Rupees per dollar</span><b>{system.usdToInr} (markup {system.markupPercent}%)</b></div>
          </div>
        )}

        <div className="card">
          <div className="chart-title" style={{ marginBottom: 8 }}>Appearance</div>
          <div className="kv" style={{ alignItems: "center" }}>
            <span>Dark mode</span>
            <button className="switch" role="switch" aria-checked={theme === "dark"} aria-label="Dark mode" onClick={toggle} />
          </div>
        </div>

        <div className="card danger-zone">
          <div className="chart-title" style={{ marginBottom: 8 }}>Danger zone</div>
          <p className="hint" style={{ marginBottom: 14 }}>Deleting your leads removes every uploaded customer. Calls already made and bookings are kept.</p>
          <div className="head-actions">
            <button className="btn btn-danger" onClick={clearLeads}><Icon name="trash" size={16} /> Delete all leads</button>
            <button className="btn" onClick={out}><Icon name="logout" size={16} /> Log out</button>
          </div>
        </div>
      </div>
    </>
  );
}
