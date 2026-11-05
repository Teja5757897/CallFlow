// Real CALL-E Developer API wrapper, matching the documented contract at
// https://docs.heycall-e.com/#/api-reference
//
// Key difference from a traditional IVR: CALL-E's agent has a natural
// conversation guided by a "task" description, not a fixed DTMF menu — it
// extracts structured answers into whatever shape you define in
// recipient_result_schema. That's what the task/schema below do.
//
// MOCK MODE: set CALLE_MOCK=true in .env to skip the real API entirely.
// Each "call" resolves after a short delay and posts a synthetic result to
// your own webhook, using the same payload shape the real API sends — so
// your webhook handler never needs to know which mode produced the data.

// Read at call time (not import time) so values from .env are always picked up.
const BASE = () => (process.env.CALLE_API_BASE || "https://api.heycall-e.com").replace(/\/+$/, "");
const NO_KEY = "No CALL-E API key. Add yours in Settings > Plan, or set CALLE_MOCK=true.";
const MOCK = () => process.env.CALLE_MOCK === "true";

export async function callEFetch(path, options = {}, apiKey = "") {
  const key = String(apiKey || "").trim();
  if (!key) throw new Error(NO_KEY);
  const res = await fetch(`${BASE()}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
      ...options.headers
    }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`CALL-E API error (${res.status}): ${text}`);
  }
  return res.json();
}

// The schema CALL-E extracts into structured_result once the call ends.
const bookingSchema = {
  type: "object",
  required: ["confirmed"],
  properties: {
    confirmed: { type: "boolean" },
    day: { type: "string", enum: ["Mon", "Tue", "Wed", "Thu", "Fri"] },
    time: { type: "string", enum: ["morning", "afternoon"] }
  }
};

const JSON_TYPE = { text: "string", yesno: "boolean", number: "number" };

// For question campaigns: one field per question (q1, q2, ...), typed by the answer kind.
function questionsSchema(questions) {
  const properties = {};
  questions.forEach((q, i) => {
    properties[`q${i + 1}`] = { type: JSON_TYPE[q.answer] ?? "string", description: q.text };
  });
  return { type: "object", properties };
}

function buildTask(goal, blocks, type, questions) {
  const steps = blocks?.length ? ` Follow these steps in order: ${blocks.join("; ")}.` : "";
  if (type === "questions") {
    const list = questions.map((q, i) => `${i + 1}) ${q.text}`).join(" ");
    return `${goal}.${steps} Ask the customer these questions one at a time, listen to each answer, and record it: ${list} Stay polite, answer their questions if you can, then thank them and end the call.`;
  }
  return `${goal}.${steps} Ask the customer which weekday (Monday to Friday) and which part of the day (morning or afternoon) works for them, then confirm the appointment with them before ending the call.`;
}

// --- Mock implementation -------------------------------------------------

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const TIMES = ["morning", "afternoon"];

// Posts a synthetic result in the same shape the real API sends.
function mockPlaceCall({ webhookUrl, metadata, type, questions }) {
  const callId = `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const delayMs = 2000 + Math.random() * 3000;

  setTimeout(async () => {
    const roll = Math.random();
    const kind = roll < 0.65 ? "confirmed" : roll < 0.8 ? "declined" : "unanswered";
    const day = DAYS[Math.floor(Math.random() * DAYS.length)];
    const time = TIMES[Math.floor(Math.random() * TIMES.length)];

    const sample = { text: "Sounds good to me.", yesno: true, number: 4 };
    const qa = type === "questions" ? questions.map((q, i) => [q, sample[q.answer] ?? sample.text, i]) : [];
    const turns = kind === "unanswered"
      ? []
      : type === "questions" && kind === "confirmed"
      ? [
          { speaker: "bot", text: "Hi, I have a few quick questions for you.", offset_seconds: 0 },
          { speaker: "user", text: "Sure, go ahead.", offset_seconds: 3 },
          ...qa.flatMap(([q, a, i]) => [
            { speaker: "bot", text: q.text, offset_seconds: 6 + i * 8 },
            { speaker: "user", text: String(a === true ? "Yes" : a), offset_seconds: 10 + i * 8 }
          ]),
          { speaker: "bot", text: "Thank you for your time. Goodbye.", offset_seconds: 12 + qa.length * 8 }
        ]
      : [
          { speaker: "bot", text: "Hi, I'm calling to book your appointment.", offset_seconds: 0 },
          { speaker: "user", text: "Hello.", offset_seconds: 4 },
          ...(kind === "confirmed"
            ? [
                { speaker: "bot", text: "Which weekday and time of day works for you?", offset_seconds: 6 },
                { speaker: "user", text: `${day}, ${time}.`, offset_seconds: 12 },
                { speaker: "bot", text: `Great, ${day} ${time}. Thank you, bye.`, offset_seconds: 15 }
              ]
            : [
                { speaker: "bot", text: "Would you like to book a slot?", offset_seconds: 6 },
                { speaker: "user", text: "No thanks, not right now.", offset_seconds: 10 }
              ])
        ];

    const status = kind === "unanswered" ? "failed" : "completed";
    const summary =
      kind === "confirmed" ? `The appointment slot was confirmed for ${day} ${time}.`
      : kind === "declined" ? "The customer declined to book."
      : "Nobody answered the call.";

    const payload = {
      type: kind === "unanswered" ? "call.failed" : "call.completed",
      data: {
        id: callId,
        status,
        summary,
        metadata,
        task_completed: kind === "confirmed",
        structured_result: null,
        recipients: [{
          status,
          summary,
          structured_result: kind === "unanswered" ? null
            : type === "questions" ? Object.fromEntries(qa.map(([q, a, i]) => [`q${i + 1}`, kind === "confirmed" ? a : null]))
            : { confirmed: kind === "confirmed", day: kind === "confirmed" ? day : null, time: kind === "confirmed" ? time : null },
          attempts: [{ status, failure_code: kind === "unanswered" ? "no_answer" : null, transcript_turns: turns }]
        }]
      }
    };

    try {
      await fetch(webhookUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    } catch (err) {
      console.error("Mock call webhook failed:", err.message);
    }
  }, delayMs);

  return Promise.resolve({ call_id: callId, status: "queued" });
}

// --- Real implementation ---------------------------------------------------

// Places one outbound call. `webhookUrl` is where CALL-E POSTs the terminal
// result when the call ends (see POST /calle/webhook in the docs).
// Real calls need E.164 numbers (+919876543210). A number that already starts with
// "+" is used as written. A bare 10-digit number gets the default country code from
// DEFAULT_COUNTRY_CODE in .env (default +91, India). Set it to +1 for US/Canada.
export function toE164(raw) {
  const cleaned = String(raw).replace(/[^\d+]/g, "");
  if (/^\+\d{8,15}$/.test(cleaned)) return cleaned;
  const cc = (process.env.DEFAULT_COUNTRY_CODE || "+91").replace(/[^\d]/g, "");
  const digits = cleaned.replace(/\D/g, "");
  if (digits.length === 10) return `+${cc}${digits}`;
  if (digits.startsWith(cc) && digits.length === cc.length + 10) return `+${digits}`;
  if (/^\d{8,15}$/.test(digits) && cleaned.startsWith("00")) return `+${digits.slice(2)}`;
  throw new Error(`Invalid phone number: ${raw}. Use the country code, e.g. +919876543210`);
}

export function placeCall({ apiKey, phone, goal, blocks, type = "booking", questions = [], webhookUrl, metadata, idempotencyKey }) {
  if (MOCK()) return mockPlaceCall({ webhookUrl, metadata, type, questions });

  const e164 = toE164(phone);
  return callEFetch("/v1/calls", {
    method: "POST",
    headers: {
      // Prevents a retry or a double-click from placing the same call twice.
      "Idempotency-Key": idempotencyKey ?? `${metadata?.callId ?? "call"}`
    },
    body: JSON.stringify({
      task: buildTask(goal, blocks, type, questions),
      recipients: [{ phones: [e164], region: e164.startsWith("+91") ? "IN" : "US", locale: e164.startsWith("+91") ? "en-IN" : "en-US" }],
      recipient_result_schema: type === "questions" ? questionsSchema(questions) : bookingSchema,
      metadata,
      webhook_url: webhookUrl
    })
  }, apiKey);
}

export function getCallStatus(callId, apiKey) {
  if (MOCK()) return Promise.resolve({ call_id: callId, status: "completed" });
  return callEFetch(`/v1/calls/${callId}`, {}, apiKey);
}

// True when CALL-E's error means the free trial / credits ran out (payment needed).
export function isQuotaError(err) {
  const m = String(err?.message || "");
  if (/concurren/i.test(m)) return false;
  return /\((402)\)|payment required|insufficient|out of credits|no credits|credit|quota|trial.{0,20}(ended|expired|over|finished)|upgrade|subscription|billing/i.test(m);
}

// Asks CALL-E whether a key is accepted. Only a 401 counts as "rejected".
export async function checkKey(apiKey) {
  if (MOCK()) return { ok: true };
  try {
    await callEFetch("/v1/calls/callflow-key-check", {}, apiKey);
    return { ok: true };
  } catch (err) {
    if (/\(401\)/.test(err.message)) return { ok: false, error: "CALL-E rejected this key. Copy it again from your CALL-E dashboard." };
    if (/fetch failed/i.test(err.message)) return { ok: true, warning: "Saved, but CALL-E could not be reached to check the key." };
    return { ok: true };
  }
}
