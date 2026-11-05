import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../api/AuthContext.jsx";
import Logo from "./Logo.jsx";
import Icon from "./Icon.jsx";
import ThemeToggle from "./ThemeToggle.jsx";
import PlanBanner from "./PlanBanner.jsx";

const NAV = [
  { to: "/dashboard", text: "Dashboard", icon: "dashboard" },
  { to: "/campaigns", text: "Campaigns", icon: "send" },
  { to: "/leads", text: "Leads", icon: "users" },
  { to: "/bookings", text: "Results", icon: "calendar" },
  { to: "/schedule", text: "Schedule", icon: "clock" },
  { to: "/meetings", text: "Meetings", icon: "video" },
  { to: "/reports", text: "Reports", icon: "file" },
  { to: "/billing", text: "Billing", icon: "card" },
  { to: "/settings", text: "Settings", icon: "user" }
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); window.scrollTo(0, 0); }, [pathname]);

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <div className="app">
      <header className="mobilebar">
        <Logo to="/dashboard" />
        <div className="mobilebar-right">
          <ThemeToggle />
          <button className="btn btn-ghost icon-btn" onClick={() => setOpen((o) => !o)} aria-label="Menu" aria-expanded={open}><Icon name={open ? "x" : "menu"} /></button>
        </div>
      </header>
      {open && <div className="scrim" onClick={() => setOpen(false)} />}

      <aside className={`sidebar${open ? " open" : ""}`}>
        <div className="sidebar-logo"><Logo to="/dashboard" /></div>
        <nav className="sidenav" aria-label="App">
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `sidenav-link${isActive ? " active" : ""}`}>
              <Icon name={item.icon} size={18} /> {item.text}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="side-user" title={user?.email ?? ""}>
            <span className="avatar">{user?.initials ?? "?"}</span>
            <span className="user-chip-text"><b>{user?.name ?? "Guest"}</b><small>{user?.email ?? ""}</small></span>
          </div>
          <div className="side-actions">
            <ThemeToggle />
            <button className="btn btn-ghost icon-btn" onClick={handleLogout} aria-label="Log out" title="Log out"><Icon name="logout" /></button>
          </div>
        </div>
      </aside>

      <main className="app-main"><div className="app-content"><PlanBanner /><Outlet /></div></main>
    </div>
  );
}
