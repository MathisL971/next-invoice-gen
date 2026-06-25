"use client";

import { useState } from "react";
import { toast } from "sonner";
import Button from "@/components/ui/button";

export default function ManageButton() {
  const [loading, setLoading] = useState(false);

  const openPortal = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data?.url) {
        throw new Error(data?.error ?? "Impossible d'ouvrir le portail");
      }
      window.location.href = data.url;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      toast.error("Portail inaccessible", { description: msg });
      setLoading(false);
    }
  };

  return (
    <Button onClick={openPortal} disabled={loading}>
      {loading ? "Ouverture…" : "Gérer l'abonnement"}
    </Button>
  );
}
