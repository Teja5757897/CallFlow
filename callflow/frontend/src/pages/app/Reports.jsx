import { useState } from "react";
import { api } from "../../api/client.js";
import { useAuth } from "../../api/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import Icon from "../../components/Icon.jsx";
import { useTitle } from "../../hooks.js";

export default function Reports() {
  useTitle("Reports");
  const { user } = useAuth();
  const { push } = useToast();
  const [file, setFile] = useState(null);
  const [recipients, setRecipients] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!file || !recipients.trim()) return setError("Add a file and at least one recipient first.");
    setSending(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("recipients", recipients);
      fd.append("note", note);
      const r = await api.sendReport(fd);
      push(`Report sent to ${r.sentTo?.length ?? 1} recipient${(r.sentTo?.length ?? 1) === 1 ? "" : "s"}.`);
      setFile(null); setNote("");
    } catch (err) {
      setError(err.message || "Couldn't send the report. Try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <div className="page-head">
        <div><h1>Reports</h1><p>Email a meeting report to your team.</p></div>
        <div className="head-actions"><a className="btn" href={api.exportUrl}><Icon name="download" size={16} /> Download bookings CSV</a></div>
      </div>


      <form className="card" style={{ maxWidth: 640 }} onSubmit={submit}>
        <label className="dropzone" style={{ marginBottom: 18 }}>
          <input type="file" onChange={(e) => setFile(e.target.files[0] ?? null)} />
          <Icon name="file" size={26} />
          <strong>{file ? file.name : "Click to choose a file"}</strong>
          <span>{file ? `${(file.size / 1024).toFixed(0)} KB` : "PDF or CSV"}</span>
        </label>
        <div className="field">
          <label className="label" htmlFor="to">Send to</label>
          <input id="to" className="input" value={recipients} onChange={(e) => setRecipients(e.target.value)} placeholder="ops@company.com, team@company.com" />
          <span className="hint">Separate several addresses with commas.</span>
        </div>
        <div className="field">
          <label className="label" htmlFor="note">Note</label>
          <input id="note" className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="This week's confirmed bookings attached" />
        </div>
        {error && <div className="form-error" role="alert">{error}</div>}
        <button className="btn btn-primary btn-lg" disabled={sending}><Icon name="mail" size={17} /> {sending ? "Sending…" : "Send report by email"}</button>
        <p className="hint" style={{ marginTop: 12 }}>Email needs SMTP settings in the server's environment variables.</p>
      </form>
    </>
  );
}
