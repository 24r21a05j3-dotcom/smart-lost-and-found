import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest, getUser } from "../services/api";

export default function Admin() {
  const user = getUser();
  const [stats, setStats] = useState(null);
  const [claims, setClaims] = useState([]);
  const [items, setItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [reasons, setReasons] = useState({});
  const [error, setError] = useState("");

  async function load() {
    try {
      const [s, c, i, u] = await Promise.all([apiRequest("/admin/stats"), apiRequest("/claims?status=pending"), apiRequest("/admin/items"), apiRequest("/admin/users")]);
      setStats(s); setClaims(c); setItems(i); setUsers(u);
    } catch (err) { setError(err.message); }
  }
  useEffect(() => { if (user?.role === "admin") load(); }, []);

  async function act(fn) {
    setError("");
    try { await fn(); load(); } catch (err) { setError(err.message); }
  }
  const patch = (path, body) => act(() => apiRequest(path, { method: "PATCH", body: JSON.stringify(body) }));
  const review = (id, decision) => patch(`/claims/${id}/review`, { decision, reason: reasons[id] || "" });
  const setStatus = (id, status) => patch(`/items/${id}`, { status });
  const removeItem = (id) => window.confirm("Delete this report permanently?") && act(() => apiRequest(`/items/${id}`, { method: "DELETE" }));
  const toggleUser = (u) => patch(`/admin/users/${u._id}`, { disabled: !u.disabled });

  if (user?.role !== "admin") return <main className="container"><p role="alert" className="error">Administrator access required.</p></main>;

  return (
    <main className="container">
      <h1>Admin dashboard</h1>
      {error && <p role="alert" className="error">{error}</p>}

      {stats && (
        <div className="stats">
          {[["Total reports", stats.total], ["Lost", stats.lost], ["Found", stats.found], ["Open", stats.open], ["Resolved", stats.resolved], ["Pending claims", stats.pendingClaims]].map(([label, n]) => (
            <div className="item-card stat" key={label}><strong>{n}</strong><span>{label}</span></div>
          ))}
        </div>
      )}

      <h2>Pending claims</h2>
      {claims.length === 0 && <p>No claims waiting for review.</p>}
      {claims.map((c) => (
        <article className="item-card claim" key={c._id}>
          <h3><Link to={`/items/${c.item?._id}`}>{c.item?.title}</Link></h3>
          <p><strong>Claimant:</strong> {c.claimant?.name} ({c.claimant?.email})</p>
          <p><strong>Evidence:</strong> {c.proof}</p>
          <label htmlFor={`r-${c._id}`}>Decision reason (required)</label>
          <input id={`r-${c._id}`} value={reasons[c._id] || ""} onChange={(e) => setReasons((p) => ({ ...p, [c._id]: e.target.value }))} maxLength={1000} />
          <div className="row">
            <button onClick={() => review(c._id, "approved")}>Approve</button>
            <button className="danger" onClick={() => review(c._id, "rejected")}>Reject</button>
          </div>
        </article>
      ))}

      <h2>Manage reports</h2>
      <div className="item-card">
        {items.map((i) => (
          <div className="admin-row" key={i._id}>
            <span><span className={`tag ${i.type}`}>{i.type}</span> <Link to={`/items/${i._id}`}>{i.title}</Link> <span className="muted">· {i.status.replace("_", " ")} · {i.owner?.name}</span></span>
            <span className="row">
              {i.status === "pending_return" && <button className="small" onClick={() => setStatus(i._id, "resolved")}>Mark returned</button>}
              {i.status === "rejected" ? <button className="small ghost" onClick={() => setStatus(i._id, "open")}>Restore</button> : i.status !== "resolved" && <button className="small ghost" onClick={() => setStatus(i._id, "rejected")}>Hide</button>}
              <button className="small danger" onClick={() => removeItem(i._id)}>Delete</button>
            </span>
          </div>
        ))}
      </div>

      <h2>Users</h2>
      <div className="item-card">
        {users.map((u) => (
          <div className="admin-row" key={u._id}>
            <span>{u.name} <span className="muted">· {u.email} · {u.role}{u.disabled ? " · disabled" : ""}</span></span>
            {u.role !== "admin" && <button className={`small ${u.disabled ? "ghost" : "danger"}`} onClick={() => toggleUser(u)}>{u.disabled ? "Enable" : "Disable"}</button>}
          </div>
        ))}
      </div>
    </main>
  );
}
