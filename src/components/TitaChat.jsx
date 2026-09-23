import { useState, useRef, useEffect } from "react";

const FUNCTIONS_BASE_URL = import.meta.env.VITE_FUNCTIONS_BASE_URL;

export default function TitaChat({ supabase }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [pendingConfirmation, setPendingConfirmation] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function getAuthHeader() {
    const { data } = await supabase.auth.getSession();
    return `Bearer ${data.session?.access_token}`;
  }

  async function sendMessage(text) {
    if (!text.trim() || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text }]);
    setLoading(true);

    try {
      const res = await fetch(`${FUNCTIONS_BASE_URL}/agent-loop`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: await getAuthHeader(),
        },
        body: JSON.stringify({ message: text, conversation_id: conversationId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error del agente.");

      setConversationId(data.conversation_id);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data.reply || "(sin respuesta de texto)",
          actions: data.actions,
        },
      ]);
      setPendingConfirmation(data.pending_confirmation ?? null);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: `⚠️ ${err.message}`, isError: true },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function resolveConfirmation(approve) {
    if (!pendingConfirmation) return;
    setLoading(true);
    try {
      const res = await fetch(`${FUNCTIONS_BASE_URL}/agent-confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: await getAuthHeader(),
        },
        body: JSON.stringify({ pending_id: pendingConfirmation.id, approve }),
      });
      await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: approve
            ? `Listo, lo confirmaste y lo ejecuté: ${pendingConfirmation.tool_name}.`
            : "Ok, no lo hago.",
          isError: !res.ok,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", text: `⚠️ ${err.message}`, isError: true }]);
    } finally {
      setPendingConfirmation(null);
      setLoading(false);
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>Tita</div>

      <div style={styles.messages}>
        {messages.map((m, i) => (
          <div key={i} style={m.role === "user" ? styles.userBubble : styles.assistantBubble}>
            <div style={m.isError ? styles.errorText : undefined}>{m.text}</div>
            {m.actions?.length > 0 && (
              <div style={styles.actionsBox}>
                {m.actions.map((a, j) => (
                  <div key={j} style={styles.actionRow}>
                    {a.status === "ok" ? "✅" : "❌"} {a.tool}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {pendingConfirmation && (
          <div style={styles.confirmBox}>
            <div>
              Quiero ejecutar <b>{pendingConfirmation.tool_name}</b> — ¿confirmás?
            </div>
            <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
              <button style={styles.confirmBtn} onClick={() => resolveConfirmation(true)}>
                Sí, dale
              </button>
              <button style={styles.rejectBtn} onClick={() => resolveConfirmation(false)}>
                No
              </button>
            </div>
          </div>
        )}

        {loading && <div style={styles.assistantBubble}>Pensando…</div>}
        <div ref={scrollRef} />
      </div>

      <form
        style={styles.inputRow}
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(input);
        }}
      >
        <input
          style={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribile a Tita..."
          disabled={loading}
        />
        <button style={styles.sendBtn} type="submit" disabled={loading}>
          Enviar
        </button>
      </form>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    maxWidth: 480,
    margin: "0 auto",
    fontFamily: "system-ui, sans-serif",
  },
  header: { padding: "12px 16px", fontWeight: 700, borderBottom: "1px solid #1f2937", color: "#fff" },
  messages: { flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 10 },
  userBubble: {
    alignSelf: "flex-end",
    background: "#2563eb",
    color: "#fff",
    padding: "8px 12px",
    borderRadius: 12,
    maxWidth: "80%",
  },
  assistantBubble: {
    alignSelf: "flex-start",
    background: "#1f2937",
    color: "#e5e7eb",
    padding: "8px 12px",
    borderRadius: 12,
    maxWidth: "85%",
  },
  errorText: { color: "#fca5a5" },
  actionsBox: { marginTop: 6, fontSize: 12, opacity: 0.8, borderTop: "1px solid #374151", paddingTop: 6 },
  actionRow: { padding: "2px 0" },
  confirmBox: {
    background: "#3f2d0f",
    border: "1px solid #92640c",
    color: "#fde68a",
    padding: 12,
    borderRadius: 12,
  },
  confirmBtn: { background: "#16a34a", color: "#fff", border: "none", borderRadius: 8, padding: "6px 14px" },
  rejectBtn: { background: "#4b5563", color: "#fff", border: "none", borderRadius: 8, padding: "6px 14px" },
  inputRow: { display: "flex", gap: 8, padding: 12, borderTop: "1px solid #1f2937" },
  input: {
    flex: 1,
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #374151",
    background: "#111827",
    color: "#fff",
  },
  sendBtn: { padding: "10px 16px", borderRadius: 10, border: "none", background: "#2563eb", color: "#fff" },
};
