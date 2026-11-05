const BASE_URL = import.meta.env.VITE_API_URL ?? "/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    ...options
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

async function upload(path, formData) {
  const res = await fetch(`${BASE_URL}${path}`, { method: "POST", body: formData, credentials: "include" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

const json = (method, body) => ({ method, body: JSON.stringify(body) });

export const api = {
  me: () => request("/auth/me"),
  login: (email, password) => request("/auth/login", json("POST", { email, password })),
  register: (name, email, password) => request("/auth/register", json("POST", { name, email, password })),
  logout: () => request("/auth/logout", { method: "POST" }),

  getDashboard: () => request("/dashboard"),

  getLeads: () => request("/leads"),
  addLead: (lead) => request("/leads", json("POST", lead)),
  setConsent: (id, consent) => request(`/leads/${id}`, json("PATCH", { consent })),
  deleteLead: (id) => request(`/leads/${id}`, { method: "DELETE" }),
  uploadLeads: (formData) => upload("/leads/upload", formData),
  clearLeads: () => request("/leads", { method: "DELETE" }),

  getCampaigns: () => request("/campaigns"),
  getCalls: () => request("/campaigns/calls"),
  startCampaign: (payload) => request("/campaigns/start", json("POST", payload)),

  getBookings: () => request("/bookings"),
  getBooking: (id) => request(`/bookings/${id}`),
  exportUrl: `${BASE_URL}/bookings/export.csv`,

  sendReport: (formData) => upload("/reports/send", formData),

  getPayConfig: () => request("/payments/config"),
  createOrder: (amountPaise) => request("/payments/order", json("POST", { amountPaise })),
  verifyPayment: (payload) => request("/payments/verify", json("POST", payload)),
  getPayments: () => request("/payments/history"),
  getPlan: () => request("/plan"),
  saveKey: (apiKey) => request("/plan/key", json("PUT", { apiKey })),
  removeKey: () => request("/plan/key", { method: "DELETE" }),
  getSystem: () => request("/plan/system"),

  getMeetings: () => request("/meetings"),
  sendInvite: (payload) => request("/meetings/invite", json("POST", payload)),
  checkEmail: () => request("/meetings/smtp-check", { method: "POST" })
};
