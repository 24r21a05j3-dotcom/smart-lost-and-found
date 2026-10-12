import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest, getUser } from "../services/api";

export default function MyReports() {
  const [items, setItems] = useState([]);
  const [claims, setClaims] = useState([]);
  const [error, setError] = useState("");

  async function load() {
    try {
      const [i, c] = await Promise.all([apiRequest("/items/mine"), apiRequest("/claims/mine")]);
      setItems(i);
      setClaims(c);
    } catch (err) { setError(err.message); }
  }
  useEffect(() => { if (getUser()) load(); }, []);

  async function remove(id) {
    if (!window.confirm("Delete this report?")) return;
    try { await apiRequest(`/items/${id}`, { method: "DELETE" }); load(); } catch (err) { setError(err.message); }
  }

  if (!getUser()) return <main className="container"><p><Link to="/login">Log in</Link> to see your reports.</p></main>;

  return (
    <main className="container">
      <h1>My reports</h1>
      {error && <p role="alert" className="error">{error}</p>}

      <h2>Reports I submitted</h2>
      {items.length === 0 && <p>No reports yet. <Link to="/report">Report an item</Link>.</p>}
      <div className="item-grid">
        {items.map((i) => (
          <article className="item-card" key={i._id}>
            <span className={`tag ${i.type}`}>{i.type}</span>
            <h3>{i.title}</h3>
            <p><strong>Status:</strong> {i.status.replace("_", " ")}</p>
            <p><Link to={`/items/${i._id}`}>View details</Link></p>
            <button className="danger" onClick={() => remove(i._id)}>Delete</button>
          </article>
        ))}
      </div>

      <h2>My claims</h2>
      {claims.length === 0 && <p>You haven't claimed any items.</p>}
      <div className="item-grid">
        {claims.map((c) => (
          <article className="item-card" key={c._id}>
            <span className={`tag ${c.status}`}>{c.status}</span>
            <h3>{c.item?.title || "Removed item"}</h3>
            {c.reviewReason && <p><strong>Reviewer note:</strong> {c.reviewReason}</p>}
            <p className="muted">Submitted {new Date(c.createdAt).toLocaleDateString()}</p>
          </article>
        ))}
      </div>
    </main>
  );
}
