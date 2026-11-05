export const STATUS_COLORS = {
  Confirmed: "#22A06B",
  Completed: "#2B8EDB",
  "Pending retry": "#E5A100",
  Declined: "#E5484D",
  "No answer": "#8A90A2",
  Failed: "#A25BD6",
  Cancelled: "#B7A58A"
};

export const STATUS_TONE = {
  Confirmed: "ok",
  Completed: "ok",
  "Pending retry": "warn",
  Declined: "bad",
  "No answer": "neutral",
  Failed: "bad",
  Cancelled: "neutral"
};

export const STATUSES = Object.keys(STATUS_COLORS);
