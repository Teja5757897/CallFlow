import { Router } from "express";
import mongoose from "mongoose";
import { Parser as CsvParser } from "json2csv";
import { Booking } from "../models/Booking.js";
import { requireAuth } from "../middleware/auth.js";

export const bookingsRouter = Router();

// All routes are scoped to the logged-in user's own bookings.
bookingsRouter.get("/", requireAuth, async (req, res) => {
  const bookings = await Booking.find({ ownerId: req.user._id }).select("-transcript").sort({ createdAt: -1 });
  res.json(
    bookings.map((b) => ({
      id: b._id,
      name: b.name,
      phone: b.phone,
      day: b.day,
      time: b.time,
      status: b.status,
      attempts: b.attempts,
      summary: b.summary,
      answers: b.answers ?? [],
      costPaise: b.costPaise ?? null,
      seconds: b.seconds ?? null,
      emailSent: b.emailSent,
      bookedOn: formatDate(b.updatedAt)
    }))
  );
});

bookingsRouter.get("/export.csv", requireAuth, async (req, res) => {
  const bookings = await Booking.find({ ownerId: req.user._id }).sort({ createdAt: -1 }).lean();
  for (const b of bookings) b.answers = (b.answers ?? []).map((a) => `${a.question}: ${a.answer}`).join(" | ");
  const parser = new CsvParser({ fields: ["name", "phone", "day", "time", "status", "answers", "attempts", "summary", "emailSent", "createdAt"] });
  res.header("Content-Type", "text/csv");
  res.attachment("results.csv");
  res.send(parser.parse(bookings));
});

// Full detail including the call transcript.
bookingsRouter.get("/:id", requireAuth, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: "Bad id." });
  const b = await Booking.findOne({ _id: req.params.id, ownerId: req.user._id });
  if (!b) return res.status(404).json({ error: "Booking not found." });
  res.json({ id: b._id, summary: b.summary, attempts: b.attempts, answers: b.answers ?? [], costPaise: b.costPaise ?? null, seconds: b.seconds ?? null, transcript: b.transcript });
});

function formatDate(date) {
  return new Date(date).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}
