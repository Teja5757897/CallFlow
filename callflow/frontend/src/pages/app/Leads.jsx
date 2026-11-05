import { useEffect, useMemo, useState } from "react";
import { api } from "../../api/client.js";
import { useToast } from "../../context/ToastContext.jsx";
import Icon from "../../components/Icon.jsx";
import { useTitle } from "../../hooks.js";

const TEMPLATE_CSV = "name,phone,consent,email\nPriya Sharma,+919876543210,yes,priya@example.com\nJohn Doe,+14155550123,no,\n";

function downloadTemplate() {
  const url = URL.createObjectURL(new Blob([TEMPLATE_CSV], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "callflow-leads-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function Leads() {
  useTitle("Leads");
  const { push } = useToast();
  const [leads, setLeads] = useState(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [uploading, setUploading] = useState(false);
  const [drag, setDrag] = useState(false);
  const [info, setInfo] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", email: "", consent: false });
  const [adding, setAdding] = useState(false);

  const load = () => api.getLeads().then(setLeads).catch(() => setLeads([]));
  useEffect(() => { load(); }, []);

  async function uploadFile(file) {
    if (!file) return;
    setUploading(true); setUploadError(""); setInfo(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await api.uploadLeads(fd);
      setInfo(r);
      push(`${r.count} lead${r.count === 1 ? "" : "s"} added.`);
      await load();
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function addLead(e) {
    e.preventDefault();
    setAdding(true);
    try {
      await api.addLead(form);
      setForm({ name: "", phone: "", email: "", consent: false });
      push("Lead added.");
      await load();
    } catch (err) {
      push(err.message, "bad");
    } finally {
      setAdding(false);
    }
  }

  async function toggle(lead) {
    const next = !lead.consent;
    setLeads((list) => list.map((l) => (l._id === lead._id ? { ...l, consent: next } : l)));
    try {
      await api.setConsent(lead._id, next);
    } catch (err) {
      setLeads((list) => list.map((l) => (l._id === lead._id ? { ...l, consent: !next } : l)));
      push(err.message, "bad");
    }
  }

  async function remove(lead) {
    if (!window.confirm(`Delete ${lead.name}?`)) return;
    try {
      await api.deleteLead(lead._id);
      setLeads((list) => list.filter((l) => l._id !== lead._id));
      push("Lead deleted.");
    } catch (err) {
      push(err.message, "bad");
    }
  }

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (leads ?? []).filter((l) => {
      if (filter === "yes" && !l.consent) return false;
      if (filter === "no" && l.consent) return false;
      return !q || l.name.toLowerCase().includes(q) || l.phone.includes(q) || (l.email ?? "").toLowerCase().includes(q);
    });
  }, [leads, query, filter]);

  const consented = (leads ?? []).filter((l) => l.consent).length;

  return (
    <>
      <div className="page-head">
        <div><h1>Leads</h1><p>{leads ? `${leads.length} in your list, ${consented} can be called.` : "Loading…"}</p></div>
        <div className="head-actions"><button className="btn" onClick={downloadTemplate}><Icon name="download" size={16} /> CSV template</button></div>
      </div>

      <label
        className={`dropzone${drag ? " drag" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); uploadFile(e.dataTransfer.files[0]); }}
      >
        <input type="file" accept=".csv" onChange={(e) => { uploadFile(e.target.files[0]); e.target.value = ""; }} />
        <Icon name="upload" size={26} className="" />
        <strong>{uploading ? "Uploading…" : "Drop a CSV here or click to choose"}</strong>
        <span>Columns: name, phone, consent (yes/no), email (optional). Max 5 MB.</span>
      </label>
      {uploadError && <div className="notice notice-bad" role="alert">{uploadError}</div>}
      {info && (
        <div className="notice notice-ok" role="status">
          <span>
            {info.count} loaded · {info.consented} can be called
            {info.noConsent > 0 ? ` · ${info.noConsent} without consent` : ""}
            {info.duplicates > 0 ? ` · ${info.duplicates} duplicates ignored` : ""}
            {info.invalid > 0 ? ` · ${info.invalid} invalid rows ignored` : ""}
          </span>
        </div>
      )}

      <div className="section-title">Add one lead</div>
      <form className="card add-form" onSubmit={addLead}>
        <div className="field"><label className="label" htmlFor="ln">Name</label><input id="ln" className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Priya Sharma" /></div>
        <div className="field"><label className="label" htmlFor="lp">Phone</label><input id="lp" className="input" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+919876543210" /></div>
        <div className="field"><label className="label" htmlFor="le">Email (optional)</label><input id="le" className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="priya@example.com" /></div>
        <label className="check-line"><input type="checkbox" checked={form.consent} onChange={(e) => setForm({ ...form, consent: e.target.checked })} /> Has consented</label>
        <button className="btn btn-primary" disabled={adding} style={{ marginBottom: 0 }}><Icon name="plus" size={16} /> Add</button>
      </form>

      <div className="section-title">Your list</div>
      <div className="toolbar">
        <div className="search">
          <Icon name="search" size={16} />
          <input className="input" placeholder="Search name, phone or email" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search leads" />
        </div>
        <div className="chips">
          {[["all", "All"], ["yes", "Consent"], ["no", "No consent"]].map(([k, l]) => (
            <button key={k} className={`chip${filter === k ? " active" : ""}`} onClick={() => setFilter(k)}>{l}</button>
          ))}
        </div>
      </div>

      {leads === null ? <div className="skeleton" style={{ height: 120 }} /> : visible.length === 0 ? (
        <div className="card empty"><strong>{leads.length === 0 ? "No leads yet" : "No matches"}</strong>{leads.length === 0 ? "Upload a CSV or add one above." : "Try a different search or filter."}</div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>Can be called</th><th /></tr></thead>
            <tbody>
              {visible.map((l) => (
                <tr key={l._id}>
                  <td><span className="primary">{l.name}</span></td>
                  <td>{l.phone}</td>
                  <td>{l.email || <span style={{ color: "var(--ink-3)" }}>—</span>}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <button className="switch" role="switch" aria-checked={l.consent} aria-label={`Consent for ${l.name}`} onClick={() => toggle(l)} />
                      <span style={{ fontSize: 13, color: "var(--ink-3)" }}>{l.consent ? "Yes" : "No"}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: "right" }}><button className="btn btn-ghost btn-sm btn-danger" onClick={() => remove(l)} aria-label={`Delete ${l.name}`}><Icon name="trash" size={15} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
