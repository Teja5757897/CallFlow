import { Call } from "../models/Call.js";
import { Campaign } from "../models/Campaign.js";
import { Lead } from "../models/Lead.js";
import { Booking } from "../models/Booking.js";
import { User } from "../models/User.js";
import { placeCall, getCallStatus, isQuotaError } from "./callE.js";
import { parseCallResult, extractTurns, isFinished } from "./calleResult.js";
import { keyForOwner, blockedReason } from "./calleAccount.js";
import { callCostPaise } from "./billing.js";
import { sendBookingConfirmation } from "./email.js";

// How many calls CALL-E lets this account have active at once (free line = 1).
const MAX_CONCURRENT = Number(process.env.CALLE_MAX_CONCURRENT ?? 1);
// Total tries per customer for calls nobody picks up.
export const MAX_ATTEMPTS = Number(process.env.CALL_MAX_ATTEMPTS ?? 3);
// How long to wait before calling an unanswered customer again.
const RETRY_DELAY_MS = Number(process.env.CALL_RETRY_DELAY_MINUTES ?? 60) * 60 * 1000;
// If CALL-E never reports back, treat the call as unanswered after this long.
const STALE_MS = 15 * 60 * 1000;
const BUSY_WAIT_MS = 15 * 1000;
const TICK_MS = 5 * 1000;

const TIME_LABEL = { morning: "10:00 AM", afternoon: "2:00 PM" };

export function webhookUrlFor(campaign) {
  const base = process.env.PUBLIC_URL ?? campaign.publicUrl;
  return `${base}/api/campaigns/webhook?secret=${encodeURIComponent(process.env.CALLE_WEBHOOK_SECRET ?? "")}`;
}

const isNetwork = (err) => /fetch failed|ECONNRESET|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|ECONNREFUSED|socket|timeout|\b50[234]\b/i.test(String(err?.message) + String(err?.cause?.code ?? ""));
const isBusy = (err) => /429|concurrency/i.test(String(err?.message));

async function saveBooking(call, fields) {
  return Booking.findOneAndUpdate(
    { callId: call._id },
    {
      $set: {
        ownerId: call.ownerId,
        leadId: call.leadId,
        campaignId: call.campaignId,
        name: call.name,
        phone: call.phone,
        attempts: call.attempts,
        ...fields
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

// Takes the cost of an answered call from the user's prepaid balance (only for people
// who paid through the website). Returns the fields to save on the result row.
async function chargeFor(call, result) {
  if (process.env.CALLE_MOCK === "true") return {};
  const owner = await User.findById(call.ownerId);
  if (!owner?.walletEnabled) return {};
  const lastTurn = result.transcript?.length ? Math.max(...result.transcript.map((t) => Number(t.at) || 0)) : 0;
  const seconds = result.durationSeconds ?? (lastTurn ? lastTurn + 6 : 30);
  const costPaise = callCostPaise(seconds);
  await User.updateOne({ _id: owner._id }, { $inc: { balancePaise: -costPaise } });
  return { seconds, costPaise };
}

// Called once a call's result is known (from the webhook, or when it times out).
// Decides: confirmed / declined / retry later / give up.
export async function finishCall(call, result) {
  if (result.outcome === "unanswered") {
    if (call.attempts < MAX_ATTEMPTS) {
      call.status = "queued";
      call.nextAttemptAt = new Date(Date.now() + RETRY_DELAY_MS);
      await call.save();
      await saveBooking(call, { status: "Pending retry", summary: result.summary, transcript: result.transcript });
      return;
    }
    call.status = "no_answer";
    call.completedAt = new Date();
    await call.save();
    await saveBooking(call, { status: "No answer", summary: result.summary, transcript: result.transcript });
    return;
  }

  call.status = "completed";
  call.note = "Finished. See the Results page.";
  call.completedAt = new Date();
  await call.save();

  const charge = await chargeFor(call, result);

  // Question campaigns: the customer picked up and talked, so save what they answered.
  const campaign = call.campaignId ? await Campaign.findById(call.campaignId) : null;
  if (campaign?.type === "questions") {
    const answers = campaign.questions.map((q, i) => {
      const v = result.structured?.[`q${i + 1}`];
      return { question: q.text, answer: v === undefined || v === null || v === "" ? "No answer given" : v === true ? "Yes" : v === false ? "No" : String(v) };
    });
    await saveBooking(call, { status: "Completed", answers, summary: result.summary, transcript: result.transcript, ...charge });
    return;
  }

  const confirmed = result.outcome === "confirmed";
  const time = result.time ? TIME_LABEL[result.time] ?? result.time : null;
  const booking = await saveBooking(call, {
    status: confirmed ? "Confirmed" : "Declined",
    day: result.day,
    time,
    summary: result.summary,
    transcript: result.transcript,
    ...charge
  });

  if (confirmed && !booking.emailSent) {
    const lead = await Lead.findById(call.leadId);
    if (lead?.email) {
      try {
        await sendBookingConfirmation({ to: lead.email, customerName: lead.name, day: result.day, time });
        booking.emailSent = true;
        await booking.save();
      } catch (err) {
        console.error("Failed to send booking confirmation email:", err.message);
      }
    }
  }
}

async function place(call) {
  const campaign = await Campaign.findById(call.campaignId);
  if (!campaign) {
    await Call.updateOne({ _id: call._id }, { status: "failed", completedAt: new Date() });
    return "failed";
  }
  try {
    // Free trial used up, or balance too low: hold the call until the user upgrades or adds money.
    const owner = await User.findById(call.ownerId);
    if (owner && blockedReason(owner)) {
      await User.updateOne({ _id: owner._id }, { trialEndedAt: new Date() });
      const why = blockedReason(owner) === "trial" ? "Waiting: your free trial is finished. Add money in Billing and this call starts by itself." : "Waiting: your balance is too low. Add money in Billing and this call starts by itself.";
      await Call.updateOne({ _id: call._id }, { status: "queued", $inc: { attempts: -1 }, nextAttemptAt: new Date(), note: why });
      return "paused";
    }
    const { key, source } = await keyForOwner(call.ownerId);
    const response = await placeCall({
      apiKey: key,
      phone: call.phone,
      goal: campaign.goal,
      blocks: campaign.blocks,
      type: campaign.type,
      questions: campaign.questions,
      webhookUrl: webhookUrlFor(campaign),
      // A new key per attempt, so a retry is a genuinely new call but a
      // network hiccup on the same attempt can't double-dial.
      idempotencyKey: `${call._id}_${call.attempts}`,
      metadata: {
        callId: call._id.toString(),
        campaignId: call.campaignId?.toString(),
        leadId: call.leadId?.toString()
      }
    });
    const extId = response?.call_id ?? response?.callId ?? response?.id ?? response?.data?.call_id ?? response?.data?.id ?? null;
    if (!extId) console.error("placeCall: CALL-E accepted the call but no call id was found in:", JSON.stringify(response).slice(0, 300));
    await Call.updateOne({ _id: call._id }, { externalCallId: extId ? String(extId) : null, note: extId ? "Call placed. Waiting for the result." : "Call placed, but CALL-E sent no call id, so the result may not appear. Check the backend log." });
    await User.updateOne({ _id: call.ownerId }, { $inc: { trialCallsUsed: 1 } });
    return "placed";
  } catch (err) {
    if (isQuotaError(err)) {
      // The CALL-E account itself is out of credit (not this user's trial). Keep the
      // call queued and try again in 10 minutes; the owner needs to top up CALL-E.
      await Call.updateOne({ _id: call._id }, { status: "queued", $inc: { attempts: -1 }, nextAttemptAt: new Date(Date.now() + 10 * 60 * 1000), note: "Waiting: the CALL-E account is out of credit. Will retry in 10 minutes." });
      console.error("CALL-E account is out of credit or trial. Top up at CALL-E.", err.message.slice(0, 200));
      return "paused";
    }
    if (isBusy(err)) {
      // Line is busy with another call. Put it back and try again shortly.
      await Call.updateOne(
        { _id: call._id },
        { status: "queued", $inc: { attempts: -1 }, nextAttemptAt: new Date(Date.now() + BUSY_WAIT_MS), note: "Waiting: the phone line is busy with another call." }
      );
      return "busy";
    }
    if (isNetwork(err)) {
      // Could not reach CALL-E, or the reply got lost. The call may even have been placed.
      // Try again shortly with the same idempotency key, so CALL-E never dials twice.
      console.error("placeCall network problem, will retry:", err.message, err.cause?.code ?? "");
      await Call.updateOne({ _id: call._id }, { status: "queued", $inc: { attempts: -1 }, nextAttemptAt: new Date(Date.now() + 30 * 1000), note: "Waiting: could not reach CALL-E (internet problem). Retrying in 30 seconds." });
      return "busy";
    }
    console.error("placeCall failed:", err.message);
    call.status = "failed";
    call.completedAt = new Date();
    call.note = `Could not place the call: ${err.message.slice(0, 250)}`;
    await call.save();
    await saveBooking(call, { status: "Failed", summary: err.message.slice(0, 300) });
    return "failed";
  }
}

let running = false;

async function tick() {
  if (running) return;
  running = true;
  try {
    // Calls CALL-E never reported back on: treat as unanswered.
    const stale = await Call.find({ status: "in_progress", placedAt: { $lt: new Date(Date.now() - STALE_MS) } });
    for (const c of stale) {
      c.note = "No result came back from CALL-E in 15 minutes. If your phone did ring, the webhook is not reaching this server: check PUBLIC_URL (ngrok must be running and match).";
      await finishCall(c, { outcome: "unanswered", summary: "No result received from CALL-E.", transcript: [] });
    }

    // Ask CALL-E how running calls are going: save the conversation so far for the
    // live view, and finish the call if its webhook never arrived.
    const running = await Call.find({
      status: "in_progress",
      externalCallId: { $nin: [null, ""] },
      placedAt: { $lt: new Date(Date.now() - 8000) }
    }).limit(5);
    for (const c of running) {
      if (String(c.externalCallId).startsWith("mock_")) continue;
      try {
        const { key } = await keyForOwner(c.ownerId);
        const resp = await getCallStatus(c.externalCallId, key);
        const turns = extractTurns(resp);
        if (turns.length) await Call.updateOne({ _id: c._id }, { liveTurns: turns });
        if (isFinished(resp)) {
          const fresh = await Call.findById(c._id);
          if (fresh?.status === "in_progress") {
            console.log(`Poll: call ${c._id} finished -> ${parseCallResult(resp).outcome}`);
            await finishCall(fresh, parseCallResult(resp));
          }
        }
      } catch (err) {
        console.error("Live check failed:", String(err.message).slice(0, 160));
      }
    }

    let active = await Call.countDocuments({ status: "in_progress" });
    while (active < MAX_CONCURRENT) {
      // Atomically claim the next due call so two ticks can never place the same one.
      // Skip people whose CALL-E trial has finished (they must upgrade first).
      const paused = await User.find({ trialEndedAt: { $ne: null } }).distinct("_id");
      const call = await Call.findOneAndUpdate(
        { status: "queued", nextAttemptAt: { $lte: new Date() }, ownerId: { $nin: paused } },
        { status: "in_progress", placedAt: new Date(), $inc: { attempts: 1 } },
        { sort: { nextAttemptAt: 1 }, new: true }
      );
      if (!call) break;
      const outcome = await place(call);
      if (outcome === "busy") break;
      if (outcome === "placed") active++;
    }
  } catch (err) {
    console.error("Call worker error:", err);
  } finally {
    running = false;
  }
}

export function kickWorker() {
  setImmediate(tick);
}

export function startCallWorker() {
  setInterval(tick, TICK_MS);
  tick();
}