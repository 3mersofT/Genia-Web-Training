"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="fr">
      <body>
        <div style={{ display: "flex", minHeight: "100vh", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem", padding: "1rem" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "bold" }}>Erreur critique</h2>
          <p>{"L'application a rencontré une erreur. Veuillez rafraîchir la page."}</p>
          <button onClick={reset} style={{ padding: "0.5rem 1rem", borderRadius: "0.375rem", backgroundColor: "#3b82f6", color: "white", border: "none", cursor: "pointer" }}>
            Réessayer
          </button>
        </div>
      </body>
    </html>
  );
}
