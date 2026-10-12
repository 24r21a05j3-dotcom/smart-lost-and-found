import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../services/api";
import { CATEGORIES } from "../constants";

export default function Home() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [type, setType] = useState("");
  const [category, setCategory] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams();
        if (debounced.trim()) params.set("q", debounced.trim());
        if (type) params.set("type", type);
        if (category) params.set("category", category);
        const result = await apiRequest(`/items?${params}`);
        if (!cancelled) setItems(result);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [debounced, type, category]);

  return (
    <main className="container">
      <section className="hero">
        <h1>Lost something? Found something?</h1>
        <p>Help your campus reconnect people with their belongings.</p>
        <Link className="primary-link" to="/report">Report an item</Link>
      </section>

      <section>
        <h2>Browse reports</h2>
        <div className="filters">
          <input aria-label="Search items" placeholder="Search by name, details, or location" value={query} onChange={(e) => setQuery(e.target.value)} />
          <select aria-label="Filter by report type" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">All reports</option>
            <option value="lost">Lost items</option>
            <option value="found">Found items</option>
          </select>
          <select aria-label="Filter by category" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All categories</option>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>

        {loading && <p>Loading reports...</p>}
        {error && <p role="alert" className="error">{error}</p>}
        {!loading && !error && items.length === 0 && <p>No matching reports. Try a different search, or report the item yourself.</p>}

        <div className="item-grid">
          {items.map((item) => (
            <article className="item-card" key={item._id}>
              <span className={`tag ${item.type}`}>{item.type}</span>
              {item.imageUrl && <img className="thumb" src={item.imageUrl} alt="" loading="lazy" />}
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <p><strong>Category:</strong> {item.category}</p>
              <p><strong>Location:</strong> {item.location}</p>
              <p><strong>Date:</strong> {new Date(item.date).toLocaleDateString()}</p>
              <p className="muted">Reported by {item.owner?.name || "Campus user"}</p>
              <Link to={`/items/${item._id}`}>View details</Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
