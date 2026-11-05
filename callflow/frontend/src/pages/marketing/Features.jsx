import Icon from "../../components/Icon.jsx";
import CtaBanner from "../../components/CtaBanner.jsx";
import { useTitle } from "../../hooks.js";

const Tick = ({ children }) => <li><Icon name="check" size={16} /> <span>{children}</span></li>;

export default function Features() {
  useTitle("Features");
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Features</span>
          <h1>Ask anything, book anything, never annoy anyone</h1>
          <p>Every part of CallFlow is designed around one outcome: a confirmed day and time on your calendar.</p>
        </div>
      </section>

      <section className="section-tight">
        <div className="container">
          <div className="split">
            <div>
              <h3>A conversation, not a phone menu</h3>
              <p>Describe the goal in plain words. The agent greets the customer, offers weekdays and morning or afternoon, and confirms before hanging up.</p>
              <ul>
                <Tick>Edit, reorder and add script steps</Tick>
                <Tick>Start from a ready-made template</Tick>
                <Tick>Works with Monday to Friday, morning or afternoon slots</Tick>
              </ul>
            </div>
            <div className="mock">
              <div className="mock-title">Script steps</div>
              {["Greet and say why we are calling", "Offer weekday and time of day", "Handle a reschedule request", "Confirm the slot and say goodbye"].map((t, i) => (
                <div className="mock-row" key={t}><span><b style={{ color: "var(--brand)", marginRight: 10 }}>{i + 1}</b>{t}</span></div>
              ))}
            </div>
          </div>

          <div className="split flip">
            <div>
              <h3>Retries that respect your customers</h3>
              <p>Customers who do not pick up are queued again after a wait, up to a limit you control. Nobody is called twice at the same time.</p>
              <ul>
                <Tick>Attempts and wait time set by environment variables</Tick>
                <Tick>Calls go out one by one, matching your line limit</Tick>
                <Tick>Stuck calls time out and are retried safely</Tick>
              </ul>
            </div>
            <div className="mock">
              <div className="mock-title">Anita Rao</div>
              <div className="mock-row"><span>Attempt 1 · 10:02</span><span className="badge badge-warn">No answer</span></div>
              <div className="mock-row"><span>Attempt 2 · 11:02</span><span className="badge badge-warn">No answer</span></div>
              <div className="mock-row"><span>Attempt 3 · 12:02</span><span className="badge badge-ok">Confirmed · Wed morning</span></div>
            </div>
          </div>

          <div className="split">
            <div>
              <h3>See everything as it happens</h3>
              <p>The dashboard shows calls in progress with live timers, the mix of outcomes and the last seven days at a glance. Open a result to read the full transcript.</p>
              <ul>
                <Tick>Auto-refreshing every few seconds</Tick>
                <Tick>Search and filter results by status</Tick>
                <Tick>Export all results to CSV</Tick>
              </ul>
            </div>
            <div className="mock">
              <div className="mock-title">Transcript</div>
              <div className="mock-row"><span><b style={{ color: "var(--ink-3)" }}>AI</b> &nbsp; Which weekday suits you?</span></div>
              <div className="mock-row"><span><b style={{ color: "var(--brand)" }}>Customer</b> &nbsp; Friday morning.</span></div>
              <div className="mock-row"><span><b style={{ color: "var(--ink-3)" }}>AI</b> &nbsp; Booked for Friday at 10:00 AM.</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head"><span className="eyebrow">And more</span><h2>The details that make it feel finished</h2></div>
          <div className="feature-grid">
            {[
              ["calendar", "Weekly schedule", "Confirmed bookings on a Monday to Friday grid."],
              ["mail", "Confirmation emails", "Sent automatically when the customer has an email on file."],
              ["users", "Lead manager", "Search, add, switch consent and delete leads."],
              ["send", "Campaign history", "See how every past campaign performed."],
              ["file", "Meeting reports", "Email a PDF or CSV report to your team in one step."],
              ["moon", "Light and dark mode", "Remembers your choice on every visit."]
            ].map(([icon, title, body]) => (
              <div className="feature" key={title}>
                <div className="feature-icon"><Icon name={icon} size={20} /></div>
                <h3>{title}</h3><p>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <CtaBanner />
    </>
  );
}
