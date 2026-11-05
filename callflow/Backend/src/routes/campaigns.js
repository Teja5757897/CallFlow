import { Router } from "express";
import mongoose from "mongoose";
import { Lead } from "../models/Lead.js";
import { Campaign } from "../models/Campaign.js";
import { Call } from "../models/Call.js";
import { requireAuth } from "../middleware/auth.js";
import { parseCallResult } from "../services/calleResult.js";
import { finishCall, kickWorker } from "../services/callWorker.js";
import { User } from "../models/User.js";
import { keyForUser, blockedReason, UPGRADE_URL } from "../services/calleAccount.js";

export const campaignsRouter = Router();

campaignsRouter.post("/start", requireAuth, async (req, res) => {
  const { goal, blocks } = req.body;
  const type = req.body.type === "questions" ? "questions" : "booking";
  const questions = type === "questions"
    ? (Array.isArray(req.body.questions) ? req.body.questions : [])
        .map((q) => ({ text: String(q?.text ?? "").trim().slice(0, 300), answer: ["text", "yesno", "number"].includes(q?.answer) ? q.answer : "text" }))
        .filter((q) => q.text)
        .slice(0, 15)
    : [];
  if (!goal || (type === "booking" && !blocks?.length)) {
    return res.status(400).json({ error: "A goal and at least one script block are required." });
  }
  if (type === "questions" && questions.length === 0) {
    return res.status(400).json({ error: "Add at least one question for the agent to ask." });
  }

  const ownerId = req.user._id;

  if (process.env.CALLE_MOCK !== "true") {
    const me = await User.findById(ownerId);
    if (!keyForUser(me).key) {
      return res.status(400).json({ error: "Calling is not set up on this server yet: the server owner must add CALLE_API_KEY to .env (or turn on CALLE_MOCK=true for test calls)." });
    }
    const why = blockedReason(me);
    if (why === "trial") return res.status(402).json({ error: "Your free trial is finished. Open Billing to add money and keep calling." });
    if (why === "balance") return res.status(402).json({ error: "Your balance is too low for another call. Open Billing to add money." });
  }

  const allLeads = await Lead.find({ uploadedBy: ownerId });
  if (allLeads.length === 0) {
    return res.status(400).json({ error: "Upload customer numbers before launching a campaign." });
  }

  // Only people who agreed to be called.
  const consented = allLeads.filter((l) => l.consent);
  if (consented.length === 0) {
    return res.status(400).json({ error: "None of your leads are marked consent = yes, so nobody can be called." });
  }

  // Don't double-dial anyone who is already waiting for / on a call.
  const activeLeadIds = new Set(
    (await Call.find({ ownerId, status: { $in: ["queued", "in_progress"] } }).select("leadId"))
      .map((c) => String(c.leadId))
  );
  const leads = consented.filter((l) => !activeLeadIds.has(String(l._id)));
  if (leads.length === 0) {
    return res.status(400).json({ error: "Everyone is already queued or on a call. Wait for those to finish." });
  }

  // CALL-E must reach this URL from the internet, so it can't be localhost.
  const publicUrl = process.env.PUBLIC_URL ?? `${req.protocol}://${req.get("host")}`;
  if (process.env.CALLE_MOCK !== "true" && /localhost|127\.0\.0\.1/.test(publicUrl)) {
    return res.status(500).json({ error: "PUBLIC_URL must be a public https URL for real calls (CALL-E can't reach localhost)." });
  }

  const campaign = await Campaign.create({ goal, blocks: Array.isArray(blocks) ? blocks : [], type, questions, publicUrl, startedBy: ownerId });

  // Queue the calls; the background worker places them one by one (and
  // retries unanswered ones later).
  await Call.insertMany(
    leads.map((lead) => ({
      ownerId,
      leadId: lead._id,
      campaignId: campaign._id,
      name: lead.name,
      phone: lead.phone,
      status: "queued"
    }))
  );
  kickWorker();

  res.json({
    campaignId: campaign._id,
    queued: leads.length,
    skippedNoConsent: allLeads.length - consented.length,
    skippedAlreadyActive: consented.length - leads.length
  });
});

// CALL-E posts here when a call finishes.
campaignsRouter.post("/webhook", async (req, res) => {
  if (!process.env.CALLE_WEBHOOK_SECRET || req.query.secret !== process.env.CALLE_WEBHOOK_SECRET) {
    console.error("WEBHOOK REJECTED: secret missing or wrong");
    return res.status(401).json({ error: "Invalid webhook secret." });
  }

  const result = parseCallResult(req.body);
  console.log(`Webhook: call ${result.metadata.callId ?? result.externalId} -> ${result.outcome}`);

  let call = null;
  if (mongoose.isValidObjectId(result.metadata.callId)) call = await Call.findById(result.metadata.callId);
  if (!call && result.externalId) call = await Call.findOne({ externalCallId: result.externalId });
  if (!call) return res.json({ ok: true, ignored: "unknown call" });

  // CALL-E may deliver the same event twice; only act on a call that's still waiting.
  if (call.status !== "in_progress") return res.json({ ok: true, ignored: "already handled" });

  await finishCall(call, result);
  res.json({ ok: true });
});

// Every call of this user's recent campaigns, with a plain-words note about what is happening.
campaignsRouter.get("/calls", requireAuth, async (req, res) => {
  const calls = await Call.find({ ownerId: req.user._id }).sort({ updatedAt: -1 }).limit(40);
  res.json(calls.map((c) => ({
    id: c._id, name: c.name, phone: c.phone, status: c.status, attempts: c.attempts,
    note: c.note || "", updatedAt: c.updatedAt
  })));
});

// Campaign history with call counts.
campaignsRouter.get("/", requireAuth, async (req, res) => {
  const campaigns = await Campaign.find({ startedBy: req.user._id }).sort({ createdAt: -1 }).limit(20);
  const counts = await Call.aggregate([
    { $match: { campaignId: { $in: campaigns.map((c) => c._id) } } },
    { $group: { _id: { c: "$campaignId", s: "$status" }, n: { $sum: 1 } } }
  ]);
  const by = {};
  for (const r of counts) {
    const k = String(r._id.c);
    by[k] ??= {};
    by[k][r._id.s] = r.n;
  }
  res.json(
    campaigns.map((c) => {
      const s = by[String(c._id)] ?? {};
      return {
        id: c._id,
        goal: c.goal,
        type: c.type,
        createdAt: c.createdAt,
        total: Object.values(s).reduce((a, b) => a + b, 0),
        queued: s.queued ?? 0,
        in_progress: s.in_progress ?? 0,
        completed: s.completed ?? 0,
        no_answer: s.no_answer ?? 0,
        failed: s.failed ?? 0
      };
    })
  );
});
