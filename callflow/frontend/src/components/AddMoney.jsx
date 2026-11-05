import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { useToast } from "../context/ToastContext.jsx";
import Icon from "./Icon.jsx";

export const rupees = (paise) => "₹" + (paise / 100).toLocaleString("en-IN", { minimumFractionDigits: paise % 100 ? 2 : 0, maximumFractionDigits: 2 });

function loadCheckout() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = resolve;
    s.onerror = () => reject(new Error("Couldn't load the payment window. Check your internet and try again."));
    document.body.appendChild(s);
  });
}

// Pay with Razorpay (UPI, cards, net banking) and add the money to the prepaid balance.
export default function AddMoney({ onAdded }) {
  const { push } = useToast();
  const [cfg, setCfg] = useState(null);
  const [custom, setCustom] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { api.getPayConfig().then(setCfg).catch(() => setCfg({ enabled: false, packs: [] })); }, []);

  async function pay(amountPaise) {
    setBusy(true);
    try {
      const o = await api.createOrder(amountPaise);
      if (o.demo) {
        // Demo mode: no payment window, no real money.
        const r = await api.verifyPayment({ razorpay_order_id: o.orderId, razorpay_payment_id: `demo_pay_${Date.now()}`, razorpay_signature: "demo" });
        push(`Demo payment: ${rupees(amountPaise)} added to your balance.`);
        onAdded?.(r);
        return;
      }
      await loadCheckout();
      await new Promise((resolve, reject) => {
        const rz = new window.Razorpay({
          key: o.keyId, order_id: o.orderId, amount: o.amountPaise, currency: "INR",
          name: "CallFlow", description: "Add money to your balance",
          prefill: { name: o.name, email: o.email },
          theme: { color: "#0F766E" },
          handler: async (resp) => {
            try {
              const r = await api.verifyPayment(resp);
              push(r.added ? `${rupees(amountPaise)} added to your balance.` : "This payment was already added.");
              onAdded?.(r);
              resolve();
            } catch (err) { reject(err); }
          },
          modal: { ondismiss: () => resolve() }
        });
        rz.on("payment.failed", (e) => reject(new Error(e?.error?.description || "The payment failed.")));
        rz.open();
      });
    } catch (err) {
      push(err.message || "Payment failed.", "bad");
    } finally { setBusy(false); }
  }

  if (!cfg) return <div className="skeleton" style={{ height: 90 }} />;
  if (!cfg.enabled) {
    return <div className="notice notice-info"><Icon name="shield" size={16} /><span>Online payments are not set up yet. The admin needs to add the Razorpay keys to the server settings.</span></div>;
  }
  const customPaise = Math.round(Number(custom) * 100);
  const customOk = customPaise >= cfg.minPaise && customPaise <= cfg.maxPaise;
  return (
    <div className="addmoney">
      {cfg.demo && <div className="notice notice-info" role="note"><Icon name="shield" size={16} /><span><b>Demo mode.</b> No real money is taken. Pressing an amount just adds it to your balance so you can try the flow.</span></div>}
      <div className="packs">
        {cfg.packs.map((p) => (
          <button key={p} type="button" className="pack" disabled={busy} onClick={() => pay(p)}>{rupees(p)}</button>
        ))}
      </div>
      <div className="pack-custom">
        <input className="input" type="number" min={cfg.minPaise / 100} max={cfg.maxPaise / 100} placeholder="Other amount (₹100 to ₹50,000)" value={custom} onChange={(e) => setCustom(e.target.value)} aria-label="Other amount in rupees" />
        <button type="button" className="btn btn-primary" disabled={busy || !customOk} onClick={() => pay(customPaise)}>{busy ? "Please wait…" : "Add money"}</button>
      </div>
      <p className="hint">Pay with UPI, cards or net banking through Razorpay. Money is added right after the payment succeeds.</p>
    </div>
  );
}
