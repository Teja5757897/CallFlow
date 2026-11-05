import mongoose from "mongoose";

const leadSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, default: null },
  // Has this person agreed to be called? Leads without consent are stored but never called.
  consent: { type: Boolean, default: false },
  // Owner: each user only ever sees and calls their own leads.
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true }
}, { timestamps: true });

leadSchema.index({ uploadedBy: 1, phone: 1 });

export const Lead = mongoose.model("Lead", leadSchema);
