import mongoose from "mongoose";

// One row per attempt to add money. "paid" rows have been added to the user's balance.
const paymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  orderId: { type: String, required: true, unique: true },
  paymentId: { type: String, default: null },
  amountPaise: { type: Number, required: true },
  status: { type: String, enum: ["created", "paid", "failed"], default: "created" }
}, { timestamps: true });

export const Payment = mongoose.model("Payment", paymentSchema);
