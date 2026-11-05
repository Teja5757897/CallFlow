import { Router } from "express";
import mongoose from "mongoose";
import multer from "multer";
import { parse } from "csv-parse/sync";
import { Lead } from "../models/Lead.js";
import { requireAuth } from "../middleware/auth.js";
import { toE164 } from "../services/callE.js";

export const leadsRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const YES = new Set(["yes", "y", "true", "1", "consent", "opted in", "opt-in"]);
const isYes = (v) => YES.has(String(v ?? "").trim().toLowerCase());

// Each user only ever sees their own leads.
leadsRouter.get("/", requireAuth, async (req, res) => {
  const leads = await Lead.find({ uploadedBy: req.user._id }).sort({ createdAt: -1 });
  res.json(leads);
});

// CSV headers: name, phone, consent, email (optional).
// "consent" must be yes/true for a person to ever be called.
leadsRouter.post("/upload", requireAuth, upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded." });

  let rows;
  try {
    rows = parse(req.file.buffer.toString("utf-8").replace(/^﻿/, ""), {
      columns: (header) => header.map((h) => String(h).trim().toLowerCase()),
      skip_empty_lines: true,
      trim: true
    });
  } catch {
    return res.status(400).json({ error: "Couldn't parse that CSV." });
  }

  if (rows.length === 0 || !("consent" in rows[0])) {
    return res.status(400).json({
      error: "The CSV needs a 'consent' column (yes/no) alongside name and phone. Only people marked 'yes' will be called."
    });
  }

  const existing = new Set((await Lead.find({ uploadedBy: req.user._id }).select("phone")).map((l) => l.phone));
  const toInsert = [];
  let invalid = 0;
  let duplicates = 0;

  for (const r of rows) {
    if (!r.name || !r.phone) { invalid++; continue; }
    let phone;
    try { phone = toE164(r.phone); } catch { invalid++; continue; }
    if (existing.has(phone)) { duplicates++; continue; }
    existing.add(phone);
    toInsert.push({
      name: r.name,
      phone,
      email: r.email || null,
      consent: isYes(r.consent),
      uploadedBy: req.user._id
    });
  }

  if (toInsert.length) await Lead.insertMany(toInsert);

  const consented = toInsert.filter((l) => l.consent).length;
  res.json({
    count: toInsert.length,
    consented,
    noConsent: toInsert.length - consented,
    invalid,
    duplicates
  });
});

// Remove all of this user's leads (handy for starting a fresh test).
leadsRouter.delete("/", requireAuth, async (req, res) => {
  const { deletedCount } = await Lead.deleteMany({ uploadedBy: req.user._id });
  res.json({ deleted: deletedCount });
});

leadsRouter.delete("/:id", requireAuth, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: "Bad id." });
  await Lead.deleteOne({ _id: req.params.id, uploadedBy: req.user._id });
  res.json({ ok: true });
});

// Add a single lead by hand.
leadsRouter.post("/", requireAuth, async (req, res) => {
  const { name, phone, email, consent } = req.body ?? {};
  if (!String(name ?? "").trim() || !phone) return res.status(400).json({ error: "Name and phone are required." });
  let e164;
  try { e164 = toE164(phone); } catch {
    return res.status(400).json({ error: "That phone number isn't valid. Use the country code, e.g. +14155550123." });
  }
  if (await Lead.findOne({ uploadedBy: req.user._id, phone: e164 })) {
    return res.status(409).json({ error: "That number is already in your list." });
  }
  const lead = await Lead.create({
    name: String(name).trim(),
    phone: e164,
    email: String(email ?? "").trim() || null,
    consent: consent === true,
    uploadedBy: req.user._id
  });
  res.status(201).json(lead);
});

// Switch a person's consent on or off (turning it off = never call again).
leadsRouter.patch("/:id", requireAuth, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: "Bad id." });
  if (typeof req.body?.consent !== "boolean") return res.status(400).json({ error: "Nothing to update." });
  const lead = await Lead.findOneAndUpdate(
    { _id: req.params.id, uploadedBy: req.user._id },
    { consent: req.body.consent },
    { new: true }
  );
  if (!lead) return res.status(404).json({ error: "Lead not found." });
  res.json(lead);
});
