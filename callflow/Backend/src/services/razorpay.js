import crypto from "crypto";

const base = () => process.env.RAZORPAY_API_BASE || "https://api.razorpay.com";
export const keyId = () => (process.env.RAZORPAY_KEY_ID || "").trim();
const secret = () => (process.env.RAZORPAY_KEY_SECRET || "").trim();
export const razorpayEnabled = () => Boolean(keyId() && secret());

export async function createOrder({ amountPaise, receipt }) {
  const res = await fetch(`${base()}/v1/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Basic " + Buffer.from(`${keyId()}:${secret()}`).toString("base64")
    },
    body: JSON.stringify({ amount: amountPaise, currency: "INR", receipt })
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error?.description || `Razorpay error ${res.status}`);
  return body; // { id, amount, currency, ... }
}

// Razorpay signs "order_id|payment_id" with your secret. Only this proves a payment is real.
export function verifySignature({ orderId, paymentId, signature }) {
  const expected = crypto.createHmac("sha256", secret()).update(`${orderId}|${paymentId}`).digest("hex");
  const a = Buffer.from(expected), b = Buffer.from(String(signature || ""));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
