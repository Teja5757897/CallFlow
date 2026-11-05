// Turns a CALL-E webhook body into one simple object the rest of the app uses.
//
// Real payload (verified from a live call):
//   { type: "call.completed", data: { id, status, summary, metadata,
//     recipients: [{ status, structured_result: {confirmed, day, time},
//                    attempts: [{ status, failure_code, transcript_turns: [...] }] }] } }
//
// outcome is one of:
//   "confirmed"  customer agreed to a slot
//   "declined"   customer picked up but did not confirm
//   "unanswered" nobody picked up / call failed - worth retrying

const OK = ["completed", "succeeded"];

export function parseCallResult(body) {
  const data = body?.data ?? body ?? {};
  const recipient = data.recipients?.[0] ?? null;
  const structured = recipient?.structured_result ?? data.structured_result ?? null;
  const attempts = recipient?.attempts ?? [];
  const last = attempts[attempts.length - 1] ?? null;

  const transcript = (last?.transcript_turns ?? []).map((t) => ({
    speaker: t.speaker,
    text: t.text,
    at: t.offset_seconds ?? null
  }));
  const customerSpoke = transcript.some((t) => t.speaker === "user");

  const callOk = body?.type !== "call.failed" && OK.includes(data.status) && (!recipient?.status || OK.includes(recipient.status));

  let outcome;
  if (!callOk) outcome = "unanswered";
  else if (structured?.confirmed) outcome = "confirmed";
  else if (attempts.length > 0 && !customerSpoke) outcome = "unanswered";
  else outcome = "declined";

  return {
    outcome,
    day: outcome === "confirmed" ? structured?.day ?? null : null,
    time: outcome === "confirmed" ? structured?.time ?? null : null,
    summary: data.summary ?? recipient?.summary ?? last?.summary ?? last?.failure_message ?? null,
    transcript,
    structured,
    durationSeconds: Number(last?.duration_seconds ?? recipient?.duration_seconds ?? data.duration_seconds ?? data.duration ?? 0) || null,
    externalId: data.id ?? null,
    metadata: data.metadata ?? {}
  };
}

// Conversation lines in a CALL-E response, even if the call has not finished.
export function extractTurns(body) {
  const data = body?.data ?? body ?? {};
  const attempts = data.recipients?.[0]?.attempts ?? data.attempts ?? [];
  const last = attempts[attempts.length - 1] ?? null;
  return (last?.transcript_turns ?? data.transcript_turns ?? [])
    .filter((t) => t?.text)
    .map((t) => ({ speaker: t.speaker, text: String(t.text), at: t.offset_seconds ?? null }));
}

// True once CALL-E says the call is over (finished, failed or cancelled).
export function isFinished(body) {
  const data = body?.data ?? body ?? {};
  const st = String(data.status ?? "").toLowerCase();
  return ["completed", "succeeded", "failed", "cancelled", "canceled", "ended"].includes(st);
}
