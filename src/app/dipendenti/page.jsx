
"use client";

import { useState } from "react";

export default function DipendentiPage() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("employee");
  const [message, setMessage] = useState("");
  const [invitations, setInvitations] = useState([]);

  function simulateInvite(event) {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return;

    setInvitations((previous) => [
      ...previous,
      {
        id: crypto.randomUUID(),
        email: normalizedEmail,
        role
      }
    ]);

    setMessage(
      "Simulazione riuscita: nessun invito reale inviato."
    );
    setEmail("");
  }

  return (
    <main style={{
      maxWidth: 680,
      margin: "40px auto",
      padding: 24,
      fontFamily: "Arial, sans-serif"
    }}>
      <h1>RistoScadenze Pro</h1>
      <h2>Gestione dipendenti</h2>

      <p>
        Modalità simulazione: nessun dato
        viene salvato su Supabase.
      </p>

      <form
        onSubmit={simulateInvite}
        style={{ display: "grid", gap: 12 }}
      >
        <label htmlFor="email">
          Email dipendente
        </label>

        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(event) =>
            setEmail(event.target.value)
          }
          style={{ padding: 12 }}
        />

        <label htmlFor="role">Ruolo</label>

        <select
          id="role"
          value={role}
          onChange={(event) =>
            setRole(event.target.value)
          }
          style={{ padding: 12 }}
        >
          <option value="employee">
            Dipendente
          </option>
          <option value="manager">
            Manager
          </option>
        </select>

        <button type="submit" style={{
          padding: 14,
          background: "#146c43",
          color: "white",
          border: 0,
          borderRadius: 8,
          cursor: "pointer"
        }}>
          Simula invito
        </button>
      </form>

      {message && <p role="status">{message}</p>}

      <h3>Inviti simulati</h3>

      {invitations.length === 0 ? (
        <p>Nessun invito simulato.</p>
      ) : (
        <ul>
          {invitations.map((invitation) => (
            <li key={invitation.id}>
              {invitation.email} —{" "}
              {invitation.role === "employee"
                ? "Dipendente"
                : "Manager"}{" "}
              (simulato)
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
