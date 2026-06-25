"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Button from "@/components/ui/button";
import { getInvoiceStatusLabel } from "@/lib/utils/labels";

interface StatusToggleProps {
  invoiceId: string;
  currentStatus: string;
}

export default function StatusToggle({
  invoiceId,
  currentStatus,
}: StatusToggleProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const updateStatus = async (newStatus: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Mise à jour impossible");
      }

      toast.success(
        `Facture marquée comme ${getInvoiceStatusLabel(newStatus).toLowerCase()}`
      );
      router.refresh();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Une erreur est survenue";
      console.error("Error updating status:", error);
      toast.error("Mise à jour du statut impossible", {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      {currentStatus !== "paid" && (
        <Button
          variant="primary"
          size="sm"
          onClick={() => updateStatus("paid")}
          disabled={loading}
        >
          Marquer payée
        </Button>
      )}
      {currentStatus === "paid" && (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => updateStatus("unpaid")}
          disabled={loading}
        >
          Marquer non payée
        </Button>
      )}
      {currentStatus === "draft" && (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => updateStatus("sent")}
          disabled={loading}
        >
          Marquer envoyée
        </Button>
      )}
    </div>
  );
}
