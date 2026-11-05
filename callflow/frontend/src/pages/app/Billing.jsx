import { useEffect, useState } from "react";
import { api } from "../../api/client.js";
import { useAuth } from "../../api/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import Icon from "../../components/Icon.jsx";
import RateCard from "../../components/RateCard.jsx";
import AddMoney, { rupees } from "../../components/AddMoney.jsx";
import { useTitle } from "../../hooks.js";

export default function Billing() {
  useTitle("Billing");
  const { user } = useAuth();
  const { push } = useToast();
  const [plan, setPlan] = useState(null);
  const [busy, setBusy] = useState(null);
  const [history, setHistory] = useState([]);
  const refresh = () => {
    api.getPlan().then(setPlan).catch(() => {});
    api.getPayments().then(setHistory).catch(() => {});
    window.dispatchEvent(new Event("plan-changed"));
  };

  useEffect(() => { api.getPlan().then(setPlan).catch(() => {}); api.getPayments().then(setHistory).catch(() => {}); }, []);

  const label = plan?.walletEnabled ? "Pay as you go" : plan?.plan === "paid" ? "Pay as you go" : plan?.trialEnded ? "Free trial finished" : "Free trial";

  return (
    <>
      <div className="page-head"><div><h1>Billing</h1><p>Add money to your balance and see what calls cost.</p></div></div>

      <div className="two-col bill-top">
        <div className="card bill-now">
          <div>
            <div className="chart-sub">Your current plan</div>
            <div className="bill-name">{label}</div>
            {plan && plan.callsLeft !== null && !plan.mock && (
              <div className="hint">{plan.callsUsed} of {plan.callsLimit} free calls used{plan.trialEnded ? ". Add money below to keep calling." : "."}</div>
            )}
          </div>
          {plan?.trialEnded && <span className="badge badge-bad">Calls paused</span>}
          {plan?.lowBalance && <span className="badge badge-bad">Balance low</span>}
          {plan?.walletEnabled && !plan.lowBalance && <span className="badge badge-ok"><Icon name="check" size={13} /> Active</span>}
        </div>
        <div className="card bill-now">
          <div>
            <div className="chart-sub">Your balance</div>
            <div className="bill-name">{rupees(plan?.balancePaise ?? 0)}</div>
            <div className="hint">Each call takes its cost from this balance.</div>
          </div>
        </div>
      </div>

          <h2 className="bill-h">Add money</h2>
        <AddMoney onAdded={refresh} />

      {history.length > 0 && (
        <>
          <h2 className="bill-h">Payments</h2>
          <div className="list">
            {history.map((h) => (
              <div className="list-row" key={h.id}>
                <span><b>{rupees(h.amountPaise)}</b> <span className="hint">added on {new Date(h.at).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })}</span></span>
                <span className="hint">{h.paymentId}</span>
              </div>
            ))}
          </div>
        </>
      )}

      <h2 className="bill-h">What calls cost</h2>
      <RateCard />
    </>
  );
}
