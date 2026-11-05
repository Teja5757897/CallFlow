// CALL-E's real rates (US dollars). Taken from CALL-E's billing page: "Rates by calling mode".
// Model fee is charged per 10 seconds, carrier fee per minute. Each started 10 seconds or
// minute counts in full, which matches CALL-E's own 30-second example ($0.0644 for Goal).
// Update the numbers here if CALL-E changes its prices.
export const RATES_REGION = "Domestic outbound · US / CA · USD";

export const RATES = [
  { direction: "Domestic outbound", mode: "One-shot-call", model: 0.0296, carrier: 0.04 },
  { direction: "Domestic outbound", mode: "Goal", model: 0.0148, carrier: 0.02, half: true },
  { direction: "Inbound", mode: "Goal", model: 0.0148, carrier: 0.0068 }
];

const [ONE_SHOT, GOAL] = RATES;
export { ONE_SHOT, GOAL };

export const usd = (n, digits = 4) => "$" + Number(n).toFixed(digits);

// Cost of one call that lasts `seconds`, split into model and carrier parts.
export function callCost(rate, seconds) {
  const model = Math.ceil(Math.max(seconds, 1) / 10) * rate.model;
  const carrier = Math.ceil(Math.max(seconds, 1) / 60) * rate.carrier;
  return { model, carrier, total: model + carrier };
}
