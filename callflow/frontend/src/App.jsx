import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./api/AuthContext.jsx";
import PublicLayout from "./components/PublicLayout.jsx";
import AppLayout from "./components/AppLayout.jsx";
import Home from "./pages/marketing/Home.jsx";
import Features from "./pages/marketing/Features.jsx";
import HowItWorks from "./pages/marketing/HowItWorks.jsx";
import Pricing from "./pages/marketing/Pricing.jsx";
import Responsible from "./pages/marketing/Responsible.jsx";
import Login from "./pages/auth/Login.jsx";
import Register from "./pages/auth/Register.jsx";
import Dashboard from "./pages/app/Dashboard.jsx";
import Campaigns from "./pages/app/Campaigns.jsx";
import Leads from "./pages/app/Leads.jsx";
import Bookings from "./pages/app/Bookings.jsx";
import Schedule from "./pages/app/Schedule.jsx";
import Reports from "./pages/app/Reports.jsx";
import Meetings from "./pages/app/Meetings.jsx";
import Billing from "./pages/app/Billing.jsx";
import Settings from "./pages/app/Settings.jsx";
import NotFound from "./pages/NotFound.jsx";

function RequireAuth({ children }) {
  const { user, checking } = useAuth();
  if (checking) return <div className="center-screen"><div className="spinner" aria-label="Loading" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/features" element={<Features />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/responsible-calling" element={<Responsible />} />
        </Route>

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/campaigns" element={<Campaigns />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/meetings" element={<Meetings />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
}
