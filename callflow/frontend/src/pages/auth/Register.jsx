import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../api/AuthContext.jsx";
import { api } from "../../api/client.js";
import AuthShell from "../../components/AuthShell.jsx";
import { useTitle } from "../../hooks.js";

export default function Register() {
  useTitle("Create account");
  const [name, setName] = useState("");
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
    if (!name || !email || !password) return setError("Fill in all fields.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    setBusy(true);
    try {
      const { user: u } = await api.register(name, email, password);
      login(u);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Couldn't create account. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Your first 5 real AI calls are free. No card needed."
      footer={<>Already have an account? <Link to="/login">Log in</Link></>}
    >
      <form onSubmit={handleSubmit} noValidate>
        {error && <div className="form-error" role="alert">{error}</div>}
        <div className="field">
          <label className="label" htmlFor="name">Name</label>
          <input id="name" className="input" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
        </div>
        <div className="field">
          <label className="label" htmlFor="email">Email</label>
          <input id="email" className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" />
        </div>
        <div className="field">
          <label className="label" htmlFor="password">Password</label>
          <div className="pw-wrap">
            <input id="password" className="input" type={show ? "text" : "password"} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" />
            <button type="button" onClick={() => setShow((s) => !s)}>{show ? "Hide" : "Show"}</button>
          </div>
        </div>
        <button type="submit" className="btn btn-primary btn-lg" style={{ width: "100%" }} disabled={busy}>{busy ? "Creating…" : "Create account"}</button>
      </form>
    </AuthShell>
  );
}
