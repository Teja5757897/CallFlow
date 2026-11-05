import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../api/AuthContext.jsx";
import { api } from "../../api/client.js";
import AuthShell from "../../components/AuthShell.jsx";
import { useTitle } from "../../hooks.js";

export default function Login() {
  useTitle("Log in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { user, checking, login } = useAuth();
  const navigate = useNavigate();

  if (!checking && user) return <Navigate to="/dashboard" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!email || !password) return setError("Enter your email and password.");
    setBusy(true);
    try {
      const { user: u } = await api.login(email, password);
      login(u);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Couldn't log in. Check your credentials.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to see your calls and bookings."
      footer={<>New to CallFlow? <Link to="/register">Create an account</Link></>}
    >
      <form onSubmit={handleSubmit} noValidate>
        {error && <div className="form-error" role="alert">{error}</div>}
        <div className="field">
          <label className="label" htmlFor="email">Email</label>
          <input id="email" className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" />
        </div>
        <div className="field">
          <label className="label" htmlFor="password">Password</label>
          <div className="pw-wrap">
            <input id="password" className="input" type={show ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" />
            <button type="button" onClick={() => setShow((s) => !s)}>{show ? "Hide" : "Show"}</button>
          </div>
        </div>
        <button type="submit" className="btn btn-primary btn-lg" style={{ width: "100%" }} disabled={busy}>{busy ? "Logging in…" : "Log in"}</button>
      </form>
    </AuthShell>
  );
}
