import { Link } from "react-router-dom";

export default function CtaBanner() {
  return (
    <section className="section-tight">
      <div className="container">
        <div className="cta">
          <h2>Turn your customer list into answers</h2>
          <p>Upload a CSV, set the goal, and let the agent do the dialing. Try it in test mode first, no real calls needed.</p>
          <Link to="/register" className="btn btn-primary btn-lg">Create your free account</Link>
        </div>
      </div>
    </section>
  );
}
