import { useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest, getUser } from "../services/api";
import { CATEGORIES, todayLocal } from "../constants";
import { prepareImage } from "../services/image";

const initialForm = () => ({ title: "", description: "", type: "lost", category: "Other", location: "", date: todayLocal(), imageUrl: "" });

export default function ReportItem() {
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!getUser()) {
    return <main className="form-page"><div className="form-card"><h1>Log in to report an item</h1><Link to="/login">Log in</Link> or <Link to="/register">create an account</Link>.</div></main>;
  }

  const update = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  async function handlePhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    setMessage("");
    setLoading(true);
    try {
      const blob = await prepareImage(file);
      const { url } = await apiRequest("/images", { method: "POST", body: blob, headers: { "Content-Type": "image/jpeg" } });
      setForm((p) => ({ ...p, imageUrl: url }));
    } catch (err) {
      setFailed(true);
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    try {
      await apiRequest("/items", { method: "POST", body: JSON.stringify(form) });
      setForm(initialForm());
      setFailed(false);
      setMessage("Your report was submitted. Track it under My reports.");
    } catch (err) {
      setFailed(true);
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="form-page">
      <form className="form-card" onSubmit={handleSubmit}>
        <h1>Report an item</h1>

        <label htmlFor="type">Report type</label>
        <select id="type" name="type" value={form.type} onChange={update}>
          <option value="lost">I lost an item</option>
          <option value="found">I found an item</option>
        </select>

        <label htmlFor="title">Item name</label>
        <input id="title" name="title" value={form.title} onChange={update} maxLength={100} required />

        <label htmlFor="description">Description</label>
        <textarea id="description" name="description" value={form.description} onChange={update} maxLength={2000} required />

        <label htmlFor="category">Category</label>
        <select id="category" name="category" value={form.category} onChange={update}>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>

        <label htmlFor="location">{form.type === "lost" ? "Last seen location" : "Where you found it"}</label>
        <input id="location" name="location" value={form.location} onChange={update} maxLength={200} required />

        <label htmlFor="date">Date lost or found</label>
        <input id="date" type="date" name="date" value={form.date} onChange={update} max={todayLocal()} required />

        <label htmlFor="photo">Photo (optional)</label>
        <input id="photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhoto} />
        {form.imageUrl && <img className="thumb" src={form.imageUrl} alt="Uploaded preview" />}

        {message && <p role={failed ? "alert" : "status"} className={failed ? "error" : "success"}>{message}</p>}
        <button disabled={loading}>{loading ? "Submitting..." : "Submit report"}</button>
      </form>
    </main>
  );
}
