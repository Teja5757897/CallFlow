import CtaBanner from "../../components/CtaBanner.jsx";
import { useTitle } from "../../hooks.js";

export default function Responsible() {
  useTitle("Responsible calling");
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Responsible calling</span>
          <h1>Calls people actually agreed to</h1>
          <p>Automation is only useful if customers are comfortable with it. These are the guardrails built into CallFlow.</p>
        </div>
      </section>
      <section className="section-tight">
        <div className="container prose">
          <h3>Consent is required, not optional</h3>
          <p>Your CSV must have a consent column. Only rows marked yes (or true, 1, opt-in) are ever called. People without consent are kept in your list so you can see them, but they are skipped on every campaign.</p>
          <h3>Opt-outs take effect immediately</h3>
          <p>Switch a person's consent off from the Leads page and they will not be called again. You can also delete any lead or clear your whole list.</p>
          <h3>No spam loops</h3>
          <ul>
            <li>Duplicate numbers are ignored when you upload</li>
            <li>Nobody who is already queued or on a call is dialed again</li>
            <li>Retries stop after your attempt limit</li>
          </ul>
          <h3>Your data stays yours</h3>
          <ul>
            <li>Every account only sees its own leads, calls and results</li>
            <li>Passwords are stored hashed, and sessions use a secure cookie</li>
            <li>Result data can be exported to CSV at any time</li>
          </ul>
          <h3>A note on regulations</h3>
          <p>Calling rules differ by country and by industry. CallFlow helps you keep a consent record, but you remain responsible for following the laws and do-not-call rules that apply to you.</p>
        </div>
      </section>
      <CtaBanner />
    </>
  );
}
