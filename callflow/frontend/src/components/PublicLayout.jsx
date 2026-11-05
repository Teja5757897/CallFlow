import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../api/AuthContext.jsx";
import Logo from "./Logo.jsx";
import Icon from "./Icon.jsx";
import ThemeToggle from "./ThemeToggle.jsx";

const links = [
  { to: "/features", label: "Features" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/pricing", label: "Pricing" },
  { to: "/responsible-calling", label: "Responsible calling" }
];

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

export default function PublicLayout() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { pathname } = useLocation();
  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <>
      <ScrollToTop />
      <header className="nav">
        <div className="container nav-inner">
          <Logo />
          <nav className={`nav-links${open ? " open" : ""}`} aria-label="Main">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} className={({ isActive }) => (isActive ? "active" : "")}>{l.label}</NavLink>
            ))}
          </nav>
          <div className="nav-actions">
            <ThemeToggle />
            {user ? (
              <Link to="/dashboard" className="btn btn-primary">Open dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost hide-sm">Log in</Link>
                <Link to="/register" className="btn btn-primary">Get started</Link>
              </>
            )}
            <button className="btn btn-ghost icon-btn nav-toggle" onClick={() => setOpen((o) => !o)} aria-label="Menu" aria-expanded={open}>
              <Icon name={open ? "x" : "menu"} />
            </button>
          </div>
        </div>
      </header>

      <main><Outlet /></main>

      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div>
              <Logo />
              <p className="tag">An AI agent that calls your customers, asks what you want to know, and saves the answers.</p>
            </div>
            <div>
              <h4>Product</h4>
              <ul>
                <li><Link to="/features">Features</Link></li>
                <li><Link to="/how-it-works">How it works</Link></li>
                <li><Link to="/pricing">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4>Company</h4>
              <ul>
                <li><Link to="/responsible-calling">Responsible calling</Link></li>
                <li><Link to="/login">Log in</Link></li>
                <li><Link to="/register">Create account</Link></li>
              </ul>
            </div>
          </div>
          <div className="footer-base">
            <span>© {new Date().getFullYear()} CallFlow</span>
            <span>Only people who said yes get a call.</span>
          </div>
        </div>
      </footer>
    </>
  );
}
