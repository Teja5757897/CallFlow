import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  callId: { type: mongoose.Schema.Types.ObjectId, ref: "Call", index: true },
  leadId: { type: mongoose.Schema.Types.ObjectId, ref: "Lead", default: null },
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: "Campaign", default: null },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  day: { type: String, default: null },
  time: { type: String, default: null },
  status: {
    type: String,
    enum: ["Confirmed", "Pending retry", "Declined", "No answer", "Failed", "Cancelled", "Completed"],
    default: "Pending retry"
  },
  attempts: { type: Number, default: 0 },
  // For question campaigns: what the customer answered to each question.
  answers: { type: [{ _id: false, question: String, answer: String }], default: [] },
  summary: { type: String, default: null },
  transcript: { type: [{ _id: false, speaker: String, text: String, at: Number }], default: [] },
  seconds: { type: Number, default: null },
  costPaise: { type: Number, default: null },
  emailSent: { type: Boolean, default: false }
}, { timestamps: true });

export const Booking = mongoose.model("Booking", bookingSchema);
