
import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey)
    : null;

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [company, setCompany] = useState(null);
  const [companyName, setCompanyName] = useState("");
  const [deadlines, setDeadlines] = useState([]);
  const [message, setMessage] = useState("");
  const [mode, setMode] = useState("login");

  async function loadCompany(userId) {
    const { data, error } = await supabase
      .from("memberships")
      .select("company_id, role, companies(id,name)")
      .eq("user_id", userId)
      .limit(1);

    if (error) {
      setMessage(error.message);
      return;
    }

    const membership = data?.[0];

    if (membership) {
      setCompany({
        id: membership.company_id,
        name: membership.companies?.name,
        role: membership.role
      });
    } else {
      setCompany(null);
    }
  }

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } =
      supabase.auth.onAuthStateChange(
        (_event, newSession) => {
          setSession(newSession);
          if (!newSession) {
            setCompany(null);
            setDeadlines([]);
          }
        }
      );

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user?.id) {
      loadCompany(session.user.id);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (!company?.id) return;

    supabase
      .from("deadlines")
      .select("*")
      .eq("company_id", company.id)
      .order("due_date")
      .then(({ data, error }) => {
        if (error) setMessage(error.message);
        else setDeadlines(data || []);
      });
  }, [company?.id]);

  async function authenticate(e) {
    e.preventDefault();
    setMessage("");

    const result =
      mode === "login"
        ? await supabase.auth.signInWithPassword({
            email,
            password
          })
        : await supabase.auth.signUp({
            email,
            password
          });

    if (result.error) {
      setMessage(result.error.message);
    } else if (mode === "register") {
      setMessage(
        "Registrazione inviata. Controlla la tua email per confermare l'account."
      );
    }
  }

  async function createCompany(e) {
    e.preventDefault();
    setMessage("");

    const { data, error } = await supabase.rpc(
      "create_my_company",
      { p_name: companyName }
    );

    if (error) {
      setMessage(error.message);
    } else {
      await loadCompany(session.user.id);
    }
  }

  if (!supabase) {
    return (
      <main className="container">
        <h1>RistoScadenze Pro</h1>
        <p>Configurazione Supabase mancante.</p>
      </main>
    );
  }

  if (loading) {
    return <main className="container">Caricamento...</main>;
  }

  if (!session) {
    return (
      <main className="container">
        <h1>RistoScadenze Pro</h1>
        <p>Gestisci tutte le scadenze del tuo ristorante.</p>

        <form onSubmit={authenticate}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />

          <button type="submit">
            {mode === "login" ? "Accedi" : "Registrati"}
          </button>
        </form>

        <button
          className="secondary"
          onClick={() =>
            setMode(mode === "login" ? "register" : "login")
          }
        >
          {mode === "login"
            ? "Crea un account"
            : "Hai già un account? Accedi"}
        </button>

        <p>{message}</p>
      </main>
    );
  }

  if (!company) {
    return (
      <main className="container">
        <h1>Benvenuto su RistoScadenze Pro</h1>
        <p>Crea la tua azienda per iniziare.</p>

        <form onSubmit={createCompany}>
          <input
            placeholder="Nome del ristorante"
            value={companyName}
            onChange={e => setCompanyName(e.target.value)}
            required
          />
          <button type="submit">Crea azienda</button>
        </form>

        <p>{message}</p>

        <button
          className="secondary"
          onClick={() => supabase.auth.signOut()}
        >
          Esci
        </button>
      </main>
    );
  }

  const today = new Date().toISOString().slice(0, 10);

  const expired = deadlines.filter(
    d => d.status !== "completed" && d.due_date < today
  );

  const completed = deadlines.filter(
    d => d.status === "completed"
  );

  return (
    <main className="container">
      <header>
        <h1>RistoScadenze Pro</h1>
        <p>{company.name}</p>
        <p>Ruolo: {company.role}</p>
      </header>

      <section className="dashboard">
        <article>
          <h2>{deadlines.length}</h2>
          <p>Scadenze totali</p>
        </article>

        <article>
          <h2>{expired.length}</h2>
          <p>Scadute</p>
        </article>

        <article>
          <h2>{completed.length}</h2>
          <p>Completate</p>
        </article>
      </section>

      <h2>Elenco scadenze</h2>

      {deadlines.length === 0 && (
        <p>Nessuna scadenza presente.</p>
      )}

      {deadlines.map(d => (
        <article key={d.id}>
          <h3>{d.title}</h3>
          <p>Categoria: {d.category}</p>
          <p>Scadenza: {d.due_date}</p>
          <p>Stato: {d.status}</p>
        </article>
      ))}

      <p>{message}</p>

      <button
        className="secondary"
        onClick={() => supabase.auth.signOut()}
      >
        Esci
      </button>
    </main>
  );
}
