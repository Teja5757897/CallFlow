import mongoose from "mongoose";

const meetingSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  title: { type: String, required: true },
  link: { type: String, required: true },
  startsAt: { type: Date, required: true },
  whenText: { type: String, default: "" },
  durationMin: { type: Number, default: 30 },
  note: { type: String, default: "" },
  sent: { type: [String], default: [] },
  failed: { type: [{ _id: false, email: String, error: String }], default: [] }
}, { timestamps: true });

export const Meeting = mongoose.model("Meeting", meetingSchema);
