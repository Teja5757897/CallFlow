import { Router } from "express";
import { User } from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";
import { encrypt } from "../services/secret.js";
import { checkKey } from "../services/callE.js";
import { publicPlan } from "../services/calleAccount.js";

import { kickWorker } from "../services/callWorker.js";

export const planRouter = Router();

planRouter.get("/", requireAuth, async (req, res) => {
  res.json(publicPlan(await User.findById(req.user._id)));
});

// Optional, advanced: a user may connect their own CALL-E key instead of the shared one.
planRouter.put("/key", requireAuth, async (req, res) => {
  const apiKey = String(req.body?.apiKey ?? "").trim();
  if (apiKey.length < 20 || /\s/.test(apiKey)) {
    return res.status(400).json({ error: "That does not look like a CALL-E API key. Copy the whole key, without spaces." });
  }
  const check = await checkKey(apiKey);
  if (!check.ok) return res.status(400).json({ error: check.error });

  const user = await User.findById(req.user._id);
  user.calleKeyEnc = encrypt(apiKey);
  user.calleKeyHint = `${apiKey.slice(0, 5)}…${apiKey.slice(-4)}`;
  user.trialEndedAt = null;
  await user.save();
  kickWorker();
  res.json({ ...publicPlan(user), warning: check.warning });
});

planRouter.delete("/key", requireAuth, async (req, res) => {
  const user = await User.findById(req.user._id);
  user.calleKeyEnc = null;
  user.calleKeyHint = null;
  await user.save();
  res.json(publicPlan(user));
});

// Which settings the server has picked up from its environment. Shows yes/no only, never a secret.
planRouter.get("/system", requireAuth, (req, res) => {
  const has = (k) => Boolean((process.env[k] || "").trim());
  const razorpay = has("RAZORPAY_KEY_ID") && has("RAZORPAY_KEY_SECRET");
  const publicUrl = process.env.PUBLIC_URL || "";
  res.json({
    callsMode: process.env.CALLE_MOCK === "true" ? "Test mode (fake calls)" : has("CALLE_API_KEY") ? "Real calls (CALL-E key set)" : "Real calls, but CALLE_API_KEY is missing",
    callsOk: process.env.CALLE_MOCK === "true" || has("CALLE_API_KEY"),
    payments: razorpay ? "Razorpay (real payments)" : process.env.PAYMENTS_DEMO === "true" ? "Demo payments (no real money)" : "Not set up",
    paymentsOk: razorpay || process.env.PAYMENTS_DEMO === "true",
    paymentsReal: razorpay,
    email: has("SMTP_HOST") && has("SMTP_USER") && has("SMTP_PASS") ? "Set up" : "SMTP settings missing",
    emailOk: has("SMTP_HOST") && has("SMTP_USER") && has("SMTP_PASS"),
    publicUrl: publicUrl || "Not set",
    publicUrlOk: Boolean(publicUrl) && !/localhost|127\.0\.0\.1/.test(publicUrl) && publicUrl.startsWith("https://"),
    webhookSecretOk: has("CALLE_WEBHOOK_SECRET"),
    usdToInr: Number(process.env.USD_TO_INR || 88),
    markupPercent: Number(process.env.PRICE_MARKUP_PERCENT || 0)
  });
});
