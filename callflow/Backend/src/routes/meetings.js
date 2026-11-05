import { Router } from "express";
import { Meeting } from "../models/Meeting.js";
import { requireAuth } from "../middleware/auth.js";
import { explainMailError, sendMeetingInvite, verifyMail } from "../services/email.js";

export const meetingsRouter = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_RECIPIENTS = 50;
// Everyone can send invites, but each account has a daily limit so the shared mailbox is not abused.
const DAILY_LIMIT = Number(process.env.INVITE_DAILY_LIMIT ?? 100);

function parseLink(raw) {
  try {
    const u = new URL(String(raw ?? "").trim());
    if (u.protocol !== "https:") return null;
    return u.toString();
  } catch {
    return null;
  }
}

// Past meetings sent by this user.
meetingsRouter.get("/", requireAuth, async (req, res) => {
  const items = await Meeting.find({ ownerId: req.user._id }).sort({ createdAt: -1 }).limit(30);
  res.json(items.map((m) => ({
    id: m._id, title: m.title, link: m.link, startsAt: m.startsAt, whenText: m.whenText,
    durationMin: m.durationMin, sent: m.sent, failed: m.failed, createdAt: m.createdAt
  })));
});

// Checks the SMTP settings without sending anything.
meetingsRouter.post("/smtp-check", requireAuth, async (req, res) => {
  try {
    await verifyMail();
    res.json({ ok: true, message: "Email settings work. The mail server accepted the login." });
  } catch (err) {
    console.error("SMTP check failed:", err);
    res.status(502).json({ error: explainMailError(err) });
  }
});

// Emails a meeting invite (with the Google Meet link and a calendar file) to each recipient.
meetingsRouter.post("/invite", requireAuth, async (req, res) => {
  const title = String(req.body?.title ?? "").trim().slice(0, 120);
  const note = String(req.body?.note ?? "").trim().slice(0, 1000);
  const whenText = String(req.body?.whenText ?? "").trim().slice(0, 100);
  const link = parseLink(req.body?.link);
  const start = new Date(req.body?.startsAt);
  const durationMin = Math.min(480, Math.max(5, Number(req.body?.durationMin) || 30));

  const list = Array.isArray(req.body?.recipients) ? req.body.recipients : String(req.body?.recipients ?? "").split(/[,;\s]+/);
  const recipients = [...new Set(list.map((r) => String(r).trim().toLowerCase()).filter(Boolean))];

  if (!title) return res.status(400).json({ error: "Give the meeting a title." });
  if (!link) return res.status(400).json({ error: "Paste a valid meeting link that starts with https:// (for example https://meet.google.com/abc-defg-hij)." });
  if (Number.isNaN(start.getTime())) return res.status(400).json({ error: "Choose a date and time for the meeting." });
  if (!recipients.length) return res.status(400).json({ error: "Add at least one recipient." });
  if (recipients.length > MAX_RECIPIENTS) return res.status(400).json({ error: `You can invite up to ${MAX_RECIPIENTS} people at a time.` });
  const bad = recipients.filter((r) => !EMAIL_RE.test(r));
  if (bad.length) return res.status(400).json({ error: `These do not look like email addresses: ${bad.slice(0, 3).join(", ")}` });

  const since = new Date(Date.now() - 24 * 3600 * 1000);
  const today = (await Meeting.find({ ownerId: req.user._id, createdAt: { $gte: since } }).select("sent")).reduce((n, m) => n + m.sent.length, 0);
  if (today + recipients.length > DAILY_LIMIT) {
    return res.status(429).json({ error: `Daily limit reached: you can email ${DAILY_LIMIT} invites per day and have sent ${today}. Try again tomorrow.` });
  }

  const sent = [];
  const failed = [];
  for (const to of recipients) {
    try {
      await sendMeetingInvite({ to, title, link, whenText: whenText || start.toUTCString(), start, durationMin, note, organizerName: req.user.name, organizerEmail: req.user.email });
      sent.push(to);
    } catch (err) {
      console.error(`Meeting invite to ${to} failed:`, err);
      failed.push({ email: to, error: explainMailError(err) });
      // A login or connection problem will fail for everyone, so stop early.
      if (["EAUTH", "ETIMEDOUT", "ECONNECTION", "ESOCKET", "ECONNREFUSED", "ENOTFOUND"].includes(err?.code)) break;
    }
  }

  await Meeting.create({ ownerId: req.user._id, title, link, startsAt: start, whenText, durationMin, note, sent, failed });

  if (!sent.length) return res.status(502).json({ error: failed[0]?.error ?? "Could not send the invites.", failed });
  res.json({ ok: true, sent, failed });
});
