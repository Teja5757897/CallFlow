import { Link } from "react-router-dom";

export function LogoMark({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="16" fill="var(--signal)" />
      <path d="M21.6 20.4v1.8a1.2 1.2 0 0 1-1.3 1.2 11.9 11.9 0 0 1-5.2-1.8 11.7 11.7 0 0 1-3.6-3.6 11.9 11.9 0 0 1-1.8-5.2A1.2 1.2 0 0 1 11 9.6h1.8a1.2 1.2 0 0 1 1.2 1 7.7 7.7 0 0 0 .4 1.7 1.2 1.2 0 0 1-.3 1.3l-.8.8a9.6 9.6 0 0 0 3.6 3.6l.8-.8a1.2 1.2 0 0 1 1.3-.3 7.7 7.7 0 0 0 1.7.4 1.2 1.2 0 0 1 1 1.2z" fill="#fff" />
      <path d="M20 8.5a4.5 4.5 0 0 1 3.5 3.5M20 11a2 2 0 0 1 1.5 1.5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export default function Logo({ to = "/" }) {
  return (
    <Link to={to} className="logo" aria-label="CallFlow home">
      <LogoMark />
      <span>Call<em>Flow</em></span>
    </Link>
  );
}
