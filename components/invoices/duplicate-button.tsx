"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Button from "@/components/ui/button";

interface DuplicateButtonProps {
  invoiceId: string;
}

export default function DuplicateButton({ invoiceId }: DuplicateButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDuplicate = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/duplicate`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to duplicate invoice");
      }

      const data = await response.json();
      toast.success("Invoice duplicated successfully");
      router.push(`/invoices/${data.id}`);
      router.refresh();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      console.error("Error duplicating invoice:", error);
      toast.error("Failed to duplicate invoice", {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="secondary" onClick={handleDuplicate} disabled={loading}>
      {loading ? "Duplicating..." : "Duplicate"}
    </Button>
  );
}
