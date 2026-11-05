import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import Icon from "./Icon.jsx";

// Shown on every page when CALL-E says the free trial is used up (calls are paused).
export default function PlanBanner() {
  const [plan, setPlan] = useState(null);
  useEffect(() => {
    const load = () => api.getPlan().then(setPlan).catch(() => {});
    load();
    const t = setInterval(load, 30000);
    window.addEventListener("plan-changed", load);
    return () => { clearInterval(t); window.removeEventListener("plan-changed", load); };
  }, []);
  if (!plan?.trialEnded && !plan?.lowBalance) return null;
  return (
    <div className="plan-banner" role="alert">
      <Icon name="shield" size={18} />
      <span>{plan.lowBalance ? <><b>Your balance is low.</b> New calls are paused until you add money.</> : <><b>Your free trial has finished.</b> Add money to keep calling.</>}</span>
      <Link className="btn btn-primary btn-sm" to="/billing">Add money</Link>
    </div>
  );
}
