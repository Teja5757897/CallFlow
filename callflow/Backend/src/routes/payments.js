import { Router } from "express";
import { User } from "../models/User.js";
import { Payment } from "../models/Payment.js";
import { requireAuth } from "../middleware/auth.js";
import { createOrder, verifySignature, keyId, razorpayEnabled } from "../services/razorpay.js";
import { usdToInr, markup, minBalancePaise } from "../services/billing.js";
import { kickWorker } from "../services/callWorker.js";

export const paymentsRouter = Router();

// Demo mode: no real money moves. Only works when PAYMENTS_DEMO=true and no Razorpay keys are set,
// so it can never run next to real payments. Use it for demos and viva only.
const demoMode = () => process.env.PAYMENTS_DEMO === "true" && !razorpayEnabled();

const PACKS = [50000, 100000, 200000, 500000]; // paise: ₹500, ₹1,000, ₹2,000, ₹5,000
const MIN = 10000;     // ₹100
const MAX = 5000000;   // ₹50,000

// Public: what the pricing page needs.
paymentsRouter.get("/config", (req, res) => {
  res.json({ enabled: razorpayEnabled() || demoMode(), demo: demoMode(), keyId: razorpayEnabled() ? keyId() : null, packs: PACKS, minPaise: MIN, maxPaise: MAX, usdToInr: usdToInr(), markupPercent: markup(), minBalancePaise: minBalancePaise() });
});

paymentsRouter.post("/order", requireAuth, async (req, res) => {
  if (!razorpayEnabled() && !demoMode()) return res.status(503).json({ error: "Online payments are not set up yet. Please try again later." });
  const amountPaise = Math.round(Number(req.body?.amountPaise));
  if (!Number.isFinite(amountPaise) || amountPaise < MIN || amountPaise > MAX) {
    return res.status(400).json({ error: "Choose an amount between ₹100 and ₹50,000." });
  }
  if (demoMode()) {
    const orderId = `demo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await Payment.create({ userId: req.user._id, orderId, amountPaise });
    return res.json({ demo: true, orderId, amountPaise, name: req.user.name, email: req.user.email });
  }
  try {
    const order = await createOrder({ amountPaise, receipt: `cf_${String(req.user._id).slice(-8)}_${Date.now()}` });
    await Payment.create({ userId: req.user._id, orderId: order.id, amountPaise });
    res.json({ orderId: order.id, amountPaise, keyId: keyId(), name: req.user.name, email: req.user.email });
  } catch (err) {
    console.error("Razorpay order failed:", err.message);
    res.status(502).json({ error: `Couldn't start the payment: ${err.message}` });
  }
});

// Called after the checkout succeeds. Adds the money once, only for a correctly signed payment.
paymentsRouter.post("/verify", requireAuth, async (req, res) => {
  const orderId = String(req.body?.razorpay_order_id ?? "");
  const paymentId = String(req.body?.razorpay_payment_id ?? "");
  const signature = String(req.body?.razorpay_signature ?? "");
  const demoOk = demoMode() && orderId.startsWith("demo_") && signature === "demo";
  if (!demoOk && (!razorpayEnabled() || !orderId || !paymentId || !verifySignature({ orderId, paymentId, signature }))) {
    return res.status(400).json({ error: "We couldn't confirm this payment. If money was taken, contact support with your payment id." });
  }
  // Atomic: only the first request flips "created" to "paid", so a repeat can't add the money twice.
  const pay = await Payment.findOneAndUpdate(
    { orderId, userId: req.user._id, status: "created" },
    { status: "paid", paymentId },
    { new: true }
  );
  const user = await User.findById(req.user._id);
  if (pay) {
    user.balancePaise += pay.amountPaise;
    user.walletEnabled = true;
    user.plan = "paid";
    user.trialEndedAt = null;
    await user.save();
    kickWorker();
  }
  res.json({ ok: true, added: Boolean(pay), balancePaise: user.balancePaise });
});

paymentsRouter.get("/history", requireAuth, async (req, res) => {
  const rows = await Payment.find({ userId: req.user._id, status: "paid" }).sort({ createdAt: -1 }).limit(20);
  res.json(rows.map((p) => ({ id: p._id, amountPaise: p.amountPaise, paymentId: p.paymentId, at: p.createdAt })));
});
