import { useState } from "react";
import { supabase } from "../supabaseClient.js";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithOtp({ email });
    setLoading(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <h1 style={styles.title}>Tita</h1>
        {sent ? (
          <p style={styles.text}>
            Te mandamos un link de acceso a <b>{email}</b>. Abrilo desde este mismo
            dispositivo para entrar.
          </p>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input
              style={styles.input}
              type="email"
              required
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button style={styles.button} type="submit" disabled={loading}>
              {loading ? "Enviando..." : "Entrar"}
            </button>
            {error && <p style={{ color: "#fca5a5", margin: 0 }}>{error}</p>}
          </form>
        )}
      </div>
    </div>
  );
}

const styles = {
  wrap: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#0B1220",
    fontFamily: "system-ui, sans-serif",
    padding: 16,
  },
  card: {
    background: "#111827",
    borderRadius: 16,
    padding: 28,
    width: "100%",
    maxWidth: 360,
    boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
  },
  title: { color: "#fff", textAlign: "center", marginBottom: 20 },
  text: { color: "#e5e7eb" },
  input: {
    padding: "12px 14px",
    borderRadius: 10,
    border: "1px solid #374151",
    background: "#0B1220",
    color: "#fff",
    fontSize: 16,
  },
  button: {
    padding: "12px 14px",
    borderRadius: 10,
    border: "none",
    background: "#2563eb",
    color: "#fff",
    fontWeight: 600,
    fontSize: 16,
  },
};
