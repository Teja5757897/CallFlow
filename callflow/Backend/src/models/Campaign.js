import mongoose from "mongoose";

const campaignSchema = new mongoose.Schema({
  goal: { type: String, required: true },
  blocks: { type: [String], default: [] },
  // "booking" asks for a weekday and time. "questions" asks whatever the user wrote.
  type: { type: String, enum: ["booking", "questions"], default: "booking" },
  questions: { type: [{ _id: false, text: String, answer: { type: String, enum: ["text", "yesno", "number"], default: "text" } }], default: [] },
  publicUrl: { type: String, default: null },
  startedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true }
}, { timestamps: true });

export const Campaign = mongoose.model("Campaign", campaignSchema);
