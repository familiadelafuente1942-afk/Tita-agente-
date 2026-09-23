import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient.js";
import Auth from "./components/Auth.jsx";
import TitaChat from "./components/TitaChat.jsx";

export default function App() {
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return <div style={styles.loading}>Cargando…</div>;
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <div style={styles.app}>
      <TitaChat supabase={supabase} />
      <button style={styles.logout} onClick={() => supabase.auth.signOut()}>
        Cerrar sesión
      </button>
    </div>
  );
}

const styles = {
  app: { height: "100vh", background: "#0B1220", display: "flex", flexDirection: "column" },
  loading: {
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#0B1220",
    color: "#9ca3af",
    fontFamily: "system-ui, sans-serif",
  },
  logout: {
    margin: 12,
    alignSelf: "center",
    background: "transparent",
    border: "1px solid #374151",
    color: "#9ca3af",
    borderRadius: 8,
    padding: "6px 12px",
    fontSize: 13,
  },
};
