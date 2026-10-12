import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiRequest, getUser } from "../services/api";

export default function ItemDetails() {
  const { id } = useParams();
  const user = getUser();
  const [item, setItem] = useState(null);
  const [matches, setMatches] = useState([]);
  const [error, setError] = useState("");
  const [proof, setProof] = useState("");
  const [msg, setMsg] = useState({ text: "", ok: false });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiRequest(`/items/${id}`);
        if (cancelled) return;
        setItem(data);
        if (user && (data.owner?._id === user.id || user.role === "admin")) {
          const m = await apiRequest(`/items/${id}/matches`).catch(() => []);
          if (!cancelled) setMatches(m);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  async function submitClaim(e) {
    e.preventDefault();
    setBusy(true);
    setMsg({ text: "", ok: false });
    try {
      await apiRequest("/claims", { method: "POST", body: JSON.stringify({ itemId: id, proof }) });
      setProof("");
      setMsg({ text: "Claim submitted. An administrator will review it. Check My reports for status.", ok: true });
    } catch (err) {
      setMsg({ text: err.message, ok: false });
    } finally {
      setBusy(false);
    }
  }

  if (error) return <main className="container"><p role="alert" className="error">{error}</p><Link to="/">Back to reports</Link></main>;
  if (!item) return <main className="container"><p>Loading...</p></main>;

  const isOwner = user && item.owner?._id === user.id;
  const canClaim = item.status === "open" && !isOwner;

  return (
    <main className="container narrow">
      <Link to="/">← All reports</Link>
      <article className="item-card detail">
        <span className={`tag ${item.type}`}>{item.type}</span>
        <h1>{item.title}</h1>
        {item.imageUrl && <img className="thumb" src={item.imageUrl} alt={item.title} />}
        <p>{item.description}</p>
        <p><strong>Category:</strong> {item.category}</p>
        <p><strong>Location:</strong> {item.location}</p>
        <p><strong>Date:</strong> {new Date(item.date).toLocaleDateString()}</p>
        <p><strong>Status:</strong> {item.status.replace("_", " ")}</p>
        <p className="muted">Reported by {item.owner?.name || "Campus user"}</p>
      </article>

      {matches.length > 0 && (
        <section className="item-card">
          <h2>Possible matches</h2>
          <p className="muted">Scores come from simple rules (category, wording, location, date). They are suggestions, not proof.</p>
          <ul className="plain-list">
            {matches.map((m) => (
              <li key={m.item._id}>
                <Link to={`/items/${m.item._id}`}>{m.item.title}</Link> at {m.item.location}
                <span className="score">{m.score}/100</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {canClaim && (
        user ? (
          <form className="form-card" onSubmit={submitClaim}>
            <h2>Claim this item</h2>
            <p className="muted">Describe details only the owner would know (marks, contents, keychain). This is visible only to administrators.</p>
            <label htmlFor="proof">Ownership evidence</label>
            <textarea id="proof" value={proof} onChange={(e) => setProof(e.target.value)} minLength={10} maxLength={2000} required />
            {msg.text && <p role={msg.ok ? "status" : "alert"} className={msg.ok ? "success" : "error"}>{msg.text}</p>}
            <button disabled={busy}>{busy ? "Submitting..." : "Submit claim"}</button>
          </form>
        ) : (
          <p><Link to="/login">Log in</Link> to claim this item.</p>
        )
      )}
    </main>
  );
}
