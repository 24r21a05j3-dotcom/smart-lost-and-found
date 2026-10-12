import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest, saveSession } from "../services/api";

export default function AuthPage({ mode }) {
  const isRegister = mode === "register";
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    try {
      const body = isRegister ? form : { email: form.email, password: form.password };
      const result = await apiRequest(`/auth/${isRegister ? "register" : "login"}`, { method: "POST", body: JSON.stringify(body) });
      saveSession(result);
      navigate("/");
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="form-page">
      <form className="form-card" onSubmit={handleSubmit}>
        <h1>{isRegister ? "Create your account" : "Welcome back"}</h1>
        <p>{isRegister ? "Register to report and claim items." : "Log in to manage your reports and claims."}</p>

        {isRegister && (
          <>
            <label htmlFor="name">Full name</label>
            <input id="name" name="name" required minLength={2} maxLength={80} value={form.name} onChange={update} />
          </>
        )}

        <label htmlFor="email">Email address</label>
        <input id="email" name="email" type="email" autoComplete="email" required value={form.email} onChange={update} />

        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required minLength={isRegister ? 8 : 1}
          autoComplete={isRegister ? "new-password" : "current-password"} value={form.password} onChange={update} />

        {message && <p role="alert" className="error">{message}</p>}

        <button disabled={loading}>{loading ? "Please wait..." : isRegister ? "Create account" : "Log in"}</button>

        <p className="muted">
          {isRegister ? <>Already registered? <Link to="/login">Log in</Link></> : <>New here? <Link to="/register">Create an account</Link></>}
        </p>
      </form>
    </main>
  );
}
