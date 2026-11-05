// How much a call costs the user, in rupees (stored as paise = 1/100 rupee).
// CALL-E charges in US dollars: a model fee for every started 10 seconds and a
// carrier fee for every started minute (Goal mode). We convert at USD_TO_INR and
// can add a markup with PRICE_MARKUP_PERCENT.
export const GOAL_MODEL_FEE = 0.0148;   // USD per 10 seconds
export const GOAL_CARRIER_FEE = 0.02;   // USD per minute

export const usdToInr = () => Number(process.env.USD_TO_INR || 88);
export const markup = () => Number(process.env.PRICE_MARKUP_PERCENT || 0);

export function callCostUsd(seconds) {
  const s = Math.max(Number(seconds) || 0, 1);
  return Math.ceil(s / 10) * GOAL_MODEL_FEE + Math.ceil(s / 60) * GOAL_CARRIER_FEE;
}

export function callCostPaise(seconds) {
  return Math.ceil(callCostUsd(seconds) * usdToInr() * (1 + markup() / 100) * 100);
}

// A user needs at least the cost of a one-minute call before the next call is placed.
export const minBalancePaise = () => callCostPaise(60);
