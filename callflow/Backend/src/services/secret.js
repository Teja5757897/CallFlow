// Encrypts users' CALL-E API keys before they are stored (AES-256-GCM).
// The encryption key is derived from JWT_SECRET, so changing JWT_SECRET means
// users have to paste their CALL-E key again.
import crypto from "crypto";

const keyBytes = () => crypto.createHash("sha256").update(String(process.env.JWT_SECRET || "")).digest();

export function encrypt(text) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", keyBytes(), iv);
  const enc = Buffer.concat([cipher.update(String(text), "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), enc].map((b) => b.toString("base64")).join(".");
}

export function decrypt(payload) {
  try {
    const [iv, tag, enc] = String(payload).split(".").map((p) => Buffer.from(p, "base64"));
    const d = crypto.createDecipheriv("aes-256-gcm", keyBytes(), iv);
    d.setAuthTag(tag);
    return Buffer.concat([d.update(enc), d.final()]).toString("utf8");
  } catch {
    return null;
  }
}
