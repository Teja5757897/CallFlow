import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  initials: { type: String, required: true },
  // Each user connects their own CALL-E account (free trial or paid).
  calleKeyEnc: { type: String, default: null },
  calleKeyHint: { type: String, default: null },
  plan: { type: String, enum: ["trial", "paid"], default: "trial" },
  // Set when CALL-E says the trial/credits are used up. Calls are paused until cleared.
  trialEndedAt: { type: Date, default: null },
  // Free-trial calls this user has placed (counted by CallFlow).
  trialCallsUsed: { type: Number, default: 0 },
  // Which paid plan they are on (starter, creator, pro) and what they last asked for.
  // Prepaid balance in paise (1/100 rupee). Used once the user has paid through the website.
  balancePaise: { type: Number, default: 0 },
  walletEnabled: { type: Boolean, default: false },
  planName: { type: String, default: null },
  requestedPlan: { type: { planId: String, cycle: String, at: Date }, default: null }
}, { timestamps: true });

export const User = mongoose.model("User", userSchema);
