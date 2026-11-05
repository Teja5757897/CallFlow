import { useNavigate } from "react-router-dom";
import RateCard from "../../components/RateCard.jsx";
import { useAuth } from "../../api/AuthContext.jsx";
import Icon from "../../components/Icon.jsx";
import { useTitle } from "../../hooks.js";

// SAMPLE PLANS: edit the names, prices and lists below to match your real offer.
const FAQ = [
  ["How does the free trial work?", "Sign up with your email and make up to 5 real AI calls for free. There is nothing to connect and no card to enter."],
  ["What happens when my free calls run out?", "Your campaigns pause and the waiting calls stay queued. Add money to your balance with UPI, a card or net banking, and they continue by themselves."],
  ["Do I need my own calling account?", "No. Calls run through CallFlow's calling account, so you never copy or paste any keys."],
  ["Who gets called?", "Only leads marked consent = yes. Everyone else stays in your list but is never dialed, and you can switch anyone off at any time."],
  ["Can I try it without making real calls?", "Yes. Test mode simulates calls and results so you can see the whole flow without a calling account."],
  ["What if a customer does not pick up?", "The call is retried later, up to your attempt limit, then marked as No answer."],
  ["Does the customer get an email?", "If the lead has an email address and the slot is confirmed, a confirmation is sent automatically."],
  ["Which languages and regions work?", "Numbers in international format are supported. Indian (+91) numbers use an English (India) voice setup, and others default to US English."]
];

export default function Pricing() {
  useTitle("Pricing");
  const navigate = useNavigate();
  const { user } = useAuth();
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Pricing</span>
          <h1>Simple pricing, no monthly fee</h1>
          <p>Your first 5 real calls are free, with no card. After that you pay CALL-E's per-call rates, with no monthly fee.</p>
        </div>
      </section>

      <section className="section-tight">
        <div className="container">
          <div className="trial-note"><Icon name="check" size={16} /> Start with <b>5 free real calls</b>. No card needed. Pay as you go after that.</div>
          <RateCard buttonText={user ? "Go to billing" : "Start free trial"} onStart={() => navigate(user ? "/billing" : "/register")} />
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head center"><span className="eyebrow">FAQ</span><h2>Questions, answered</h2></div>
          <div className="faq">
            {FAQ.map(([q, a]) => (
              <details key={q}><summary>{q}</summary><p>{a}</p></details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
