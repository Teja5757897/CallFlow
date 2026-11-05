import { User } from "../models/User.js";
import { decrypt } from "./secret.js";
import { minBalancePaise } from "./billing.js";

export const TRIAL_LIMIT = () => Number(process.env.TRIAL_CALL_LIMIT ?? 5);
export const UPGRADE_URL = () => process.env.UPGRADE_URL || process.env.CALLE_BILLING_URL || "https://www.heycall-e.com";

// Which CALL-E key places this user's calls. Automatic: the server's shared key
// from .env. (A user can optionally connect their own key under Advanced.)
export function keyForUser(user) {
  if (user?.calleKeyEnc) {
    const k = decrypt(user.calleKeyEnc);
    if (k) return { key: k, source: "own" };
  }
  const shared = (process.env.CALLE_API_KEY || "").trim();
  if (shared) return { key: shared, source: "shared" };
  return { key: "", source: "none" };
}

export async function keyForOwner(ownerId) {
  return keyForUser(await User.findById(ownerId));
}

// Trial users get TRIAL_CALL_LIMIT free calls; paid users are unlimited.
const exempt = (user) => process.env.CALLE_MOCK === "true";

// Free trial used up (people who have not paid yet).
export const trialOver = (user) =>
  !exempt(user) && !user.walletEnabled && user.plan !== "paid" && user.trialCallsUsed >= TRIAL_LIMIT();

// Paid through the website but the prepaid balance is almost empty.
export const lowBalance = (user) => !exempt(user) && user.walletEnabled && user.balancePaise < minBalancePaise();

// Why this user's calls should wait, or null if they can go ahead.
export const blockedReason = (user) => (trialOver(user) ? "trial" : lowBalance(user) ? "balance" : null);

export const publicPlan = (user) => {
  const { key, source } = keyForUser(user);
  const limit = TRIAL_LIMIT();
  return {
    plan: user.plan,
    planName: user.planName,
    requestedPlan: user.requestedPlan ? { id: user.requestedPlan.planId, cycle: user.requestedPlan.cycle } : null,
    email: user.email,
    connected: Boolean(key),
    source,
    keyHint: user.calleKeyHint,
    trialEnded: trialOver(user),
    lowBalance: lowBalance(user),
    balancePaise: user.balancePaise,
    walletEnabled: user.walletEnabled,
    callsUsed: user.trialCallsUsed,
    callsLimit: limit,
    callsLeft: user.plan === "paid" || user.walletEnabled ? null : Math.max(0, limit - user.trialCallsUsed),
    mock: process.env.CALLE_MOCK === "true",
    upgradeUrl: UPGRADE_URL()
  };
};
