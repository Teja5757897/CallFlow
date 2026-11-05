import { Router } from "express";
import { Booking } from "../models/Booking.js";
import { Call } from "../models/Call.js";
import { requireAuth } from "../middleware/auth.js";

export const dashboardRouter = Router();

dashboardRouter.get("/", requireAuth, async (req, res) => {
  const ownerId = req.user._id;
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - 6);

  const [totalCalls, ongoing, booked, total, recent, byStatus, byDay] = await Promise.all([
    Call.countDocuments({ ownerId, attempts: { $gt: 0 } }),
    Call.find({ ownerId, status: "in_progress" }).sort({ createdAt: -1 }).limit(10),
    Booking.countDocuments({ ownerId, status: { $in: ["Confirmed", "Completed"] } }),
    Booking.countDocuments({ ownerId }),
    Booking.find({ ownerId }).sort({ updatedAt: -1 }).limit(5),
    Booking.aggregate([{ $match: { ownerId } }, { $group: { _id: "$status", n: { $sum: 1 } } }]),
    Booking.aggregate([
      { $match: { ownerId, updatedAt: { $gte: since } } },
      { $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } },
          total: { $sum: 1 },
          confirmed: { $sum: { $cond: [{ $in: ["$status", ["Confirmed", "Completed"]] }, 1, 0] } }
      } }
    ])
  ]);

  const outcomes = Object.fromEntries(byStatus.map((r) => [r._id, r.n]));
  const dayMap = Object.fromEntries(byDay.map((r) => [r._id, r]));
  const daily = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    return { date: key, total: dayMap[key]?.total ?? 0, confirmed: dayMap[key]?.confirmed ?? 0 };
  });

  const conversion = total ? `${Math.round((booked / total) * 100)}%` : "0%";

  const ongoingCalls = ongoing.map((c) => ({
    id: c._id,
    name: c.name,
    phone: c.phone,
    startedAt: c.createdAt,
    live: (c.liveTurns ?? []).slice(-6)
  }));

  const recentCalls = recent.map((b) => ({
    name: b.name,
    label: "booking call",
    status: b.status,
    tone: ["Confirmed", "Completed"].includes(b.status) ? "success" : ["Cancelled", "Declined", "Failed", "No answer"].includes(b.status) ? "danger" : "warning"
  }));

  res.json({
    stats: { totalCalls, ongoing: ongoing.length, booked, conversion },
    ongoingCalls,
    recentCalls,
    outcomes,
    daily
  });
});
