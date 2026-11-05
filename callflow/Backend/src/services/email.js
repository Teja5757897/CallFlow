import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  // Fail within seconds instead of hanging when the mail server can't be reached.
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 20000
});

const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Turns a nodemailer error into a message a person can act on.
export function explainMailError(err) {
  const code = err?.code;
  const text = String(err?.response ?? err?.message ?? "");
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return "Email is not set up: SMTP_HOST, SMTP_USER and SMTP_PASS are missing in the server's environment.";
  }
  if (code === "EAUTH" || /535|Username and Password not accepted|Invalid login/i.test(text)) {
    return "The mail server rejected the login. With Gmail, turn on 2-Step Verification and use a 16-character App Password in SMTP_PASS (not your normal password). If you made a new app password, update it in .env or Render and restart.";
  }
  if (["ETIMEDOUT", "ECONNECTION", "ESOCKET", "ECONNREFUSED", "ENOTFOUND", "EDNS"].includes(code) || /timeout|ENOTFOUND/i.test(text)) {
    return "Could not reach the mail server. Check SMTP_HOST and SMTP_PORT (Gmail: smtp.gmail.com and 587). Some hosts, including Render's free plan, block outgoing SMTP, so try it from your own computer or use a paid instance or an email API.";
  }
  if (/EENVELOPE|Invalid recipient|recipient/i.test(`${code} ${text}`)) {
    return "The mail server did not accept one of the recipient addresses. Check the email addresses.";
  }
  return "The mail server refused the message: " + text.slice(0, 160);
}

export function verifyMail() {
  return transporter.verify();
}

const icsDate = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const icsText = (v) => String(v ?? "").replace(/\r?\n/g, "\\n").replace(/[,;]/g, (c) => "\\" + c);

// A calendar invite that most mail apps show as "Add to calendar".
function buildIcs({ title, link, start, end, note, organizerEmail }) {
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//CallFlow//Meeting//EN", "METHOD:REQUEST", "BEGIN:VEVENT",
    `UID:${Date.now()}-${Math.random().toString(36).slice(2)}@callflow`,
    `DTSTAMP:${icsDate(new Date())}`, `DTSTART:${icsDate(start)}`, `DTEND:${icsDate(end)}`,
    `SUMMARY:${icsText(title)}`, `DESCRIPTION:${icsText((note ? note + "\n" : "") + "Join: " + link)}`,
    `LOCATION:${icsText(link)}`, `URL:${link}`,
    organizerEmail ? `ORGANIZER:mailto:${organizerEmail}` : "", "END:VEVENT", "END:VCALENDAR"
  ].filter(Boolean).join("\r\n");
}

export function sendMeetingInvite({ to, title, link, whenText, start, durationMin, note, organizerName, organizerEmail }) {
  const end = new Date(start.getTime() + durationMin * 60000);
  const safeNote = esc(note).replace(/\n/g, "<br>");
  return transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    replyTo: organizerEmail || undefined,
    subject: `Meeting invite: ${title}`,
    text: `${organizerName} invited you to a video meeting.\n\n${title}\nWhen: ${whenText}\nJoin: ${link}\n${note ? "\n" + note + "\n" : ""}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#2A1D17">
      <h2 style="margin:0 0 6px">${esc(title)}</h2>
      <p style="margin:0 0 18px;color:#5C4A40">${esc(organizerName)} invited you to a video meeting.</p>
      <p style="margin:0 0 4px"><strong>When:</strong> ${esc(whenText)}</p>
      <p style="margin:0 0 18px"><strong>Duration:</strong> ${durationMin} minutes</p>
      ${safeNote ? `<p style="margin:0 0 18px">${safeNote}</p>` : ""}
      <p><a href="${esc(link)}" style="background:#0F766E;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:bold;display:inline-block">Join the meeting</a></p>
      <p style="color:#8A766A;font-size:13px">Or open this link: <a href="${esc(link)}">${esc(link)}</a></p>
    </div>`,
    icalEvent: { method: "REQUEST", content: buildIcs({ title, link, start, end, note, organizerEmail: process.env.SMTP_USER }) }
  });
}

export function sendBookingConfirmation({ to, customerName, day, time }) {
  return transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: `Your appointment is confirmed — ${day} at ${time}`,
    text: `Hi ${customerName},\n\nYour appointment is confirmed for ${day} at ${time}.\n\nSee you then!`,
    html: `<p>Hi ${customerName},</p><p>Your appointment is confirmed for <strong>${day} at ${time}</strong>.</p><p>See you then!</p>`
  });
}

export function sendReportEmail({ to, note, filePath, fileName, replyTo }) {
  return transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    replyTo: replyTo || undefined,
    subject: "CallFlow meeting report",
    text: note || "Please find the attached report.",
    html: `<p>${note || "Please find the attached report."}</p>`,
    attachments: [{ filename: fileName, path: filePath }]
  });
}
