import { Router } from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { requireAuth } from "../middleware/auth.js";
import { explainMailError, sendReportEmail } from "../services/email.js";

export const reportsRouter = Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const upload = multer({ dest: path.join(__dirname, "../../data/uploads"), limits: { fileSize: 10 * 1024 * 1024 } });
// Everyone can email reports, with a daily limit per account.
const DAILY_LIMIT = Number(process.env.REPORT_DAILY_LIMIT ?? 50);
const sentToday = new Map(); // userId -> { day, n }

reportsRouter.post("/send", requireAuth, upload.single("file"), async (req, res) => {
  const { recipients, note } = req.body;
  if (!req.file || !recipients) {
    return res.status(400).json({ error: "A file and at least one recipient are required." });
  }

  const to = recipients.split(",").map((r) => r.trim()).filter(Boolean).slice(0, 20);

  const day = new Date().toISOString().slice(0, 10);
  const rec = sentToday.get(String(req.user._id));
  const used = rec?.day === day ? rec.n : 0;
  if (used + to.length > DAILY_LIMIT) {
    fs.unlink(req.file.path, () => {});
    return res.status(429).json({ error: `Daily limit reached: you can email ${DAILY_LIMIT} reports per day.` });
  }

  try {
    await sendReportEmail({ to, note, filePath: req.file.path, fileName: req.file.originalname, replyTo: req.user.email });
    sentToday.set(String(req.user._id), { day, n: used + to.length });
    res.json({ ok: true, sentTo: to });
  } catch (err) {
    console.error("Failed to send report email:", err);
    res.status(502).json({ error: explainMailError(err) });
  } finally {
    fs.unlink(req.file.path, () => {});
  }
});
