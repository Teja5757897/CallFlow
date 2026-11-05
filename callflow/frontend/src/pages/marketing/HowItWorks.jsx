import CtaBanner from "../../components/CtaBanner.jsx";
import { useTitle } from "../../hooks.js";

const OUTCOMES = [
  ["Confirmed", "badge-ok", "The customer agreed to a day and time. The booking is saved and the email goes out."],
  ["Pending retry", "badge-warn", "Nobody picked up yet. The call is queued again after a wait."],
  ["Declined", "badge-bad", "The customer answered and said no. They are not called again."],
  ["No answer", "badge-neutral", "All attempts used up without an answer."],
  ["Failed", "badge-bad", "The call could not be placed, for example an invalid number."]
];

export default function HowItWorks() {
  useTitle("How it works");
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">How it works</span>
          <h1>Four steps from CSV to answers</h1>
          <p>Here is exactly what happens after you press Launch.</p>
        </div>
      </section>

      <section className="section-tight">
        <div className="container">
          <div className="timeline">
            <div className="tl-item"><div className="tl-dot">1</div><div>
              <h3>Upload your leads</h3>
              <p>Use a CSV with these columns: <code>name</code>, <code>phone</code>, <code>consent</code> and optionally <code>email</code>.</p>
              <ul><li>Phone numbers are cleaned into international format</li><li>Duplicates and invalid rows are skipped and counted</li><li>Rows without consent are stored but never called</li></ul>
            </div></div>
            <div className="tl-item"><div className="tl-dot">2</div><div>
              <h3>Build the campaign</h3>
              <p>Write the goal in plain words, pick a template, and arrange the script steps. Review how many people will be called, then launch.</p>
            </div></div>
            <div className="tl-item"><div className="tl-dot">3</div><div>
              <h3>The agent makes the calls</h3>
              <p>Calls are placed one at a time. The agent asks for a weekday and morning or afternoon, confirms it, and the result comes back to CallFlow.</p>
              <ul><li>No answer? It retries later, up to your limit</li><li>Everyone is checked so nobody is dialed twice at once</li></ul>
            </div></div>
            <div className="tl-item"><div className="tl-dot">4</div><div>
              <h3>Results, email and reports</h3>
              <p>Each call becomes a result with the answers, a summary and a transcript. Confirmed bookings also email the customer, and you can export or email a report.</p>
            </div></div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head"><span className="eyebrow">Outcomes</span><h2>What every call can end as</h2></div>
          <div className="outcomes">
            {OUTCOMES.map(([name, cls, text]) => (
              <div className="outcome" key={name}><span className={`badge ${cls}`}>{name}</span><p>{text}</p></div>
            ))}
          </div>
        </div>
      </section>
      <CtaBanner />
    </>
  );
}
