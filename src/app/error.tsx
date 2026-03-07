"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Une erreur est survenue</h2>
        <p className="text-muted-foreground mb-4">
          {"L'erreur a été signalée automatiquement. Veuillez réessayer."}
        </p>
        <Button onClick={reset}>Réessayer</Button>
      </div>
    </div>
  );
}
