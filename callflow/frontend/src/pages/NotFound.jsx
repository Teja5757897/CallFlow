import { Link } from "react-router-dom";
import { useTitle } from "../hooks.js";

export default function NotFound() {
  useTitle("Page not found");
  return (
    <div className="notfound">
      <h1>404</h1>
      <p style={{ margin: "8px 0 24px", color: "var(--ink-2)" }}>That page doesn't exist.</p>
      <Link to="/" className="btn btn-primary">Back to home</Link>
    </div>
  );
}
