import { Link } from "react-router-dom";
import Logo from "./Logo.jsx";
import Icon from "./Icon.jsx";
import ThemeToggle from "./ThemeToggle.jsx";

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="auth">
      <aside className="auth-side">
        <Logo />
        <div>
          <h2>Let the phone ring. You collect the bookings.</h2>
          <p>CallFlow calls your customers, agrees a day and time, and emails the confirmation.</p>
        </div>
        <ul className="auth-points">
          <li><Icon name="shield" size={18} /> Only people who gave consent are called</li>
          <li><Icon name="repeat" size={18} /> Unanswered calls are retried for you</li>
          <li><Icon name="calendar" size={18} /> Confirmed slots appear on your weekly schedule</li>
        </ul>
      </aside>
      <main className="auth-main">
        <div className="auth-top"><ThemeToggle /></div>
        <div className="auth-card">
          <div style={{ marginBottom: 22 }} className="auth-mobile-logo"><Logo /></div>
          <h1>{title}</h1>
          <p className="sub">{subtitle}</p>
          {children}
          <p className="auth-foot">{footer}</p>
          <p className="auth-foot"><Link to="/">← Back to home</Link></p>
        </div>
      </main>
    </div>
  );
}
