import "./env.js";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./db.js";

import { authRouter } from "./routes/auth.js";
import { leadsRouter } from "./routes/leads.js";
import { campaignsRouter } from "./routes/campaigns.js";
import { bookingsRouter } from "./routes/bookings.js";
import { reportsRouter } from "./routes/reports.js";
import { meetingsRouter } from "./routes/meetings.js";
import { planRouter } from "./routes/plan.js";
import { paymentsRouter } from "./routes/payments.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { startCallWorker } from "./services/callWorker.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Behind Render/Docker proxies, so req.protocol reports https correctly.
app.set("trust proxy", 1);

// Render and similar hosts sit behind a proxy that handles https; trust it so cookies are marked Secure.
app.set("trust proxy", 1);
app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/leads", leadsRouter);
app.use("/api/campaigns", campaignsRouter);
app.use("/api/bookings", bookingsRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/meetings", meetingsRouter);
app.use("/api/plan", planRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/dashboard", dashboardRouter);

app.get("/api/health", (req, res) => res.json({ ok: true }));

// Serve the built React app (Docker copies it into ./public); unknown non-API pages open index.html
const publicDir = path.join(__dirname, "../public");
app.use(express.static(publicDir));
app.use((req, res, next) => {
  if (req.method !== "GET" || req.path.startsWith("/api")) return next();
  res.sendFile(path.join(publicDir, "index.html"), (err) => err && next());
});

const PORT = process.env.PORT ?? 4000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`CallFlow API listening on :${PORT}`);
      startCallWorker();
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err.message);
    process.exit(1);
  });
