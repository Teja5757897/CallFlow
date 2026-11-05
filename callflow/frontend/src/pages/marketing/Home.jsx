import { Link } from "react-router-dom";
import Icon from "../../components/Icon.jsx";
import LiveCallDemo from "../../components/LiveCallDemo.jsx";
import CtaBanner from "../../components/CtaBanner.jsx";
import { useTitle } from "../../hooks.js";

const steps = [
  { n: 1, title: "Upload your list", body: "Drop in a CSV with name, phone and consent. Duplicates and bad numbers are cleaned out for you." },
  { n: 2, title: "Tell it what to ask", body: "Describe the call, then write your own questions or pick a template. The agent holds a natural conversation, not a key-press menu." },
  { n: 3, title: "Get the results", body: "Answers, summaries and full transcripts land in your Results page. Confirmed bookings also reach your schedule and the customer gets an email." }
];

const useCases = [
  { title: "Customer feedback", body: "Ask how the visit went and collect scores and comments.", q: "How satisfied were you, from 1 to 5?" },
  { title: "Lead qualification", body: "Find out who is interested before your team spends time.", q: "Are you planning to start this month?" },
  { title: "Reminders and RSVPs", body: "Confirm attendance, payments or deliveries in one call.", q: "Will you be able to attend on Friday?" },
  { title: "Book appointments", body: "The agent agrees a weekday and time and emails the confirmation.", q: "Does Thursday afternoon work for you?" }
];

const features = [
  { icon: "shield", title: "Consent-first", body: "Only people marked consent = yes are ever dialed. Switch anyone off with one click." },
  { icon: "repeat", title: "Smart retries", body: "No answer? The agent tries again later, up to your limit, and never double-dials anyone." },
  { icon: "chart", title: "Live dashboard", body: "Watch calls in progress, outcomes and a 7-day trend refresh on their own." },
  { icon: "file", title: "Full transcripts", body: "Open any result to read the answers, the summary and the whole conversation turn by turn." },
  { icon: "mail", title: "Automatic emails", body: "Confirmed customers receive their day and time by email the moment the call ends." },
  { icon: "calendar", title: "Weekly schedule", body: "See every confirmed slot on a Monday to Friday grid so you can spot busy times." }
];

export default function Home() {
  useTitle("");
  return (
    <>
      <section className="hero">
        <div className="container hero-center">
          <span className="kicker"><i /> AI calling, consent first</span>
          <h1>Your AI agent makes the calls. <em>You get the answers.</em></h1>
          <p className="lead">Upload your customers and tell the agent what to ask. CallFlow rings them, holds the conversation, and saves every answer. Book appointments, run surveys, qualify leads, or ask anything else.</p>
          <div className="hero-actions">
            <Link to="/register" className="btn btn-primary btn-lg">Start your free trial <Icon name="arrow" size={18} /></Link>
            <Link to="/how-it-works" className="btn btn-lg">See how it works</Link>
          </div>
          <div className="hero-note">
            <span><Icon name="check" size={16} /> 5 free real calls, no card needed</span>
            <span><Icon name="check" size={16} /> Only consented numbers</span>
            <span><Icon name="check" size={16} /> Light and dark themes</span>
          </div>
        </div>
        <div className="container hero-stage">
          <div className="float-chip fc-1"><Icon name="check" size={16} /> 3 answers saved</div>
          <LiveCallDemo />
          <div className="float-chip fc-2"><Icon name="mail" size={16} /> Confirmation sent</div>
        </div>
      </section>

      <section className="section-tight">
        <div className="container">
          <div className="stat-strip">
            <div><b>3</b><span>call attempts per customer, adjustable</span></div>
            <div><b>100%</b><span>of calls checked for consent first</span></div>
            <div><b>1</b><span>click to export every result to CSV</span></div>
            <div><b>0</b><span>key-press menus: it just talks</span></div>
          </div>
        </div>
      </section>

      <section className="section-tight">
        <div className="container">
          <div className="trial-band">
            <div>
              <span className="eyebrow">Free trial</span>
              <h2>Try real AI calls before you pay anything</h2>
              <p>Create an account and your first <b>5 calls are free</b>. No card, no setup, and no calling account to connect. When the free calls are used up, your campaigns pause and wait. Upgrade and they carry on by themselves.</p>
            </div>
            <ol className="trial-steps">
              <li><b>1</b><span>Sign up with your email</span></li>
              <li><b>2</b><span>Make up to 5 free calls</span></li>
              <li><b>3</b><span>Upgrade when you want more</span></li>
            </ol>
            <div className="trial-cta">
              <Link to="/register" className="btn btn-primary btn-lg">Start free trial <Icon name="arrow" size={18} /></Link>
              <Link to="/pricing" className="btn btn-lg">See plans</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">How it works</span>
            <h2>From spreadsheet to calendar in three steps</h2>
            <p>No call scripts to record and no phone trees to build.</p>
          </div>
          <div className="steps">
            {steps.map((s) => (
              <div key={s.n} className="step">
                <div className="step-num">{s.n}</div>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Use it for anything</span>
            <h2>You decide what the agent asks</h2>
            <p>Write your own questions and the agent asks each one, listens, and records the answer.</p>
          </div>
          <div className="usecases">
            {useCases.map((u) => (
              <div key={u.title} className="usecase"><h3>{u.title}</h3><p>{u.body}</p><span>{u.q}</span></div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Features</span>
            <h2>Everything between "dial" and "done"</h2>
          </div>
          <div className="feature-grid">
            {features.map((f) => (
              <div key={f.title} className="feature">
                <div className="feature-icon"><Icon name={f.icon} size={20} /></div>
                <h3>{f.title}</h3>
                <p>{f.body}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 28 }}>
            <Link to="/features" className="btn">Explore all features <Icon name="arrow" size={16} /></Link>
          </div>
        </div>
      </section>

      <CtaBanner />
    </>
  );
}
