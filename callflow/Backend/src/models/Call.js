import mongoose from "mongoose";

// One row per lead per campaign. This doubles as the call queue:
//   queued       waiting to be placed (now, or later for a retry)
//   in_progress  placed with CALL-E, waiting for its webhook
//   completed    customer answered (confirmed or declined) - done
//   no_answer    never picked up after all attempts - done
//   failed       couldn't be placed at all - done
const callSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  leadId: { type: mongoose.Schema.Types.ObjectId, ref: "Lead" },
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: "Campaign" },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  externalCallId: { type: String, default: null },
  status: { type: String, enum: ["queued", "in_progress", "completed", "no_answer", "failed"], default: "queued", index: true },
  attempts: { type: Number, default: 0 },
  nextAttemptAt: { type: Date, default: () => new Date() },
  placedAt: { type: Date, default: null },
  completedAt: { type: Date, default: null },
  // Plain-words status shown on the Campaigns page (why a call is waiting or failed).
  note: { type: String, default: "" },
  // Latest conversation lines seen while the call is still going (for the live view).
  liveTurns: { type: [{ speaker: String, text: String, at: Number, _id: false }], default: [] }
}, { timestamps: true });

export const Call = mongoose.model("Call", callSchema);
