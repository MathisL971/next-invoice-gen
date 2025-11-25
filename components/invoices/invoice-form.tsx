"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import Button from "@/components/ui/button";

interface InvoiceItem {
  id?: string;
  description: string;
  additional_info?: string;
  unit_price_ht: number;
  quantity: number;
  total_ht: number;
  order_index: number;
}

interface Invoice {
  id?: string;
  reference?: string;
  version?: string;
  client_id?: string;
  client_reference?: string;
  invoice_date: string;
  due_date: string;
  payment_method: string;
  status?: string;
  vat_applicable: boolean;
  vat_article?: string;
  notes?: string;
  items?: InvoiceItem[];
}

interface Client {
  id: string;
  name: string;
  reference: string;
}

interface InvoiceFormProps {
  invoice?: Invoice;
  clients?: Client[];
}

export default function InvoiceForm({
  invoice,
  clients = [],
}: InvoiceFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [clientsList, setClientsList] = useState<Client[]>(clients);
  const [items, setItems] = useState<InvoiceItem[]>(
    invoice?.items || [
      {
        description: "",
        unit_price_ht: 0,
        quantity: 1,
        total_ht: 0,
        order_index: 0,
      },
    ]
  );

  const [formData, setFormData] = useState<Invoice>({
    reference: invoice?.reference || "",
    client_id: invoice?.client_id || "",
    invoice_date:
      invoice?.invoice_date || new Date().toISOString().split("T")[0],
    due_date:
      invoice?.due_date ||
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
    payment_method: invoice?.payment_method || "Virement",
    vat_applicable: invoice?.vat_applicable || false,
    vat_article: invoice?.vat_article || "",
    notes: invoice?.notes || "",
  });

  useEffect(() => {
    loadClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadClients = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("clients")
      .select("id, name, reference")
      .eq("user_id", user.id)
      .order("name");

    if (data) {
      setClientsList(data);
    }
  };

  const updateItem = (
    index: number,
    field: keyof InvoiceItem,
    value: string | number
  ) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    if (field === "unit_price_ht" || field === "quantity") {
      newItems[index].total_ht =
        parseFloat(newItems[index].unit_price_ht.toString()) *
        parseFloat(newItems[index].quantity.toString());
    }
    setItems(newItems);
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        description: "",
        unit_price_ht: 0,
        quantity: 1,
        total_ht: 0,
        order_index: items.length,
      },
    ]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.total_ht || 0), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You must be logged in");
      toast.error("You must be logged in");
      setLoading(false);
      return;
    }

    if (!formData.client_id) {
      setError("Please select a client");
      toast.error("Please select a client");
      setLoading(false);
      return;
    }

    if (invoice?.id && !formData.reference?.trim()) {
      setError("Invoice reference is required");
      toast.error("Invoice reference is required");
      setLoading(false);
      return;
    }

    if (
      items.length === 0 ||
      items.some((item) => !item.description || item.total_ht === 0)
    ) {
      setError("Please add at least one valid line item");
      toast.error("Please add at least one valid line item");
      setLoading(false);
      return;
    }

    try {
      if (invoice?.id) {
        // Check if reference has changed and if it's unique
        if (formData.reference && formData.reference !== invoice.reference) {
          const { data: existingInvoice } = await supabase
            .from("invoices")
            .select("id")
            .eq("user_id", user.id)
            .eq("reference", formData.reference)
            .neq("id", invoice.id)
            .maybeSingle();

          if (existingInvoice) {
            setError("An invoice with this reference already exists");
            toast.error("An invoice with this reference already exists");
            setLoading(false);
            return;
          }
        }

        // Increment version when updating
        const currentVersion = parseFloat(invoice.version || "1.0");
        const newVersion = (currentVersion + 0.1).toFixed(1);

        // Update existing invoice
        const { error: updateError } = await supabase
          .from("invoices")
          .update({
            reference: formData.reference || invoice.reference,
            client_id: formData.client_id,
            invoice_date: formData.invoice_date,
            due_date: formData.due_date,
            payment_method: formData.payment_method,
            vat_applicable: formData.vat_applicable,
            vat_article: formData.vat_article || null,
            notes: formData.notes || null,
            version: newVersion,
            updated_at: new Date().toISOString(),
          })
          .eq("id", invoice.id)
          .eq("user_id", user.id);

        if (updateError) throw updateError;

        // Delete existing items and insert new ones
        await supabase
          .from("invoice_items")
          .delete()
          .eq("invoice_id", invoice.id);
      } else {
        // Create new invoice - use database function to generate reference
        const { data: refData, error: refError } = await supabase.rpc(
          "generate_invoice_reference",
          { p_user_id: user.id }
        );

        if (refError) throw refError;

        // Get client reference
        const selectedClient = clientsList.find(
          (c) => c.id === formData.client_id
        );
        if (!selectedClient) {
          throw new Error("Client not found");
        }

        const { data: newInvoice, error: insertError } = await supabase
          .from("invoices")
          .insert({
            user_id: user.id,
            reference: refData,
            client_id: formData.client_id,
            client_reference: selectedClient.reference,
            invoice_date: formData.invoice_date,
            due_date: formData.due_date,
            payment_method: formData.payment_method,
            status: "draft",
            vat_applicable: formData.vat_applicable,
            vat_article: formData.vat_article || null,
            notes: formData.notes || null,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        if (newInvoice) {
          // Insert items
          const itemsToInsert = items.map((item, index) => ({
            invoice_id: newInvoice.id,
            description: item.description,
            additional_info: item.additional_info || null,
            unit_price_ht: item.unit_price_ht,
            quantity: item.quantity,
            total_ht: item.total_ht,
            order_index: index,
          }));

          const { error: itemsError } = await supabase
            .from("invoice_items")
            .insert(itemsToInsert);

          if (itemsError) throw itemsError;

          toast.success("Invoice created successfully");
          router.push(`/invoices/${newInvoice.id}`);
          router.refresh();
          return;
        }
      }

      // Update items for existing invoice
      if (invoice?.id) {
        const itemsToInsert = items.map((item, index) => ({
          invoice_id: invoice.id,
          description: item.description,
          additional_info: item.additional_info || null,
          unit_price_ht: item.unit_price_ht,
          quantity: item.quantity,
          total_ht: item.total_ht,
          order_index: index,
        }));

        const { error: itemsError } = await supabase
          .from("invoice_items")
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;

        toast.success("Invoice updated successfully");
        router.refresh();
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      toast.error("Failed to save invoice", {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const totalHT = calculateTotal();
  const totalTTC = formData.vat_applicable ? totalHT * 1.2 : totalHT;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {invoice?.id && (
          <Input
            label="Invoice Reference"
            required
            value={formData.reference || ""}
            onChange={(e) =>
              setFormData({ ...formData, reference: e.target.value })
            }
            placeholder="e.g., F-000067"
          />
        )}

        <Select
          label="Client"
          required
          value={formData.client_id}
          onChange={(e) =>
            setFormData({ ...formData, client_id: e.target.value })
          }
          options={[
            { value: "", label: "Select a client" },
            ...clientsList.map((client) => ({
              value: client.id,
              label: `${client.name} (${client.reference})`,
            })),
          ]}
        />

        <Input
          label="Invoice Date"
          type="date"
          required
          value={formData.invoice_date}
          onChange={(e) =>
            setFormData({ ...formData, invoice_date: e.target.value })
          }
        />

        <Input
          label="Due Date"
          type="date"
          required
          value={formData.due_date}
          onChange={(e) =>
            setFormData({ ...formData, due_date: e.target.value })
          }
        />

        <Select
          label="Payment Method"
          value={formData.payment_method}
          onChange={(e) =>
            setFormData({ ...formData, payment_method: e.target.value })
          }
          options={[
            { value: "Virement", label: "Virement" },
            { value: "Chèque", label: "Chèque" },
            { value: "Espèces", label: "Espèces" },
            { value: "Carte", label: "Carte" },
          ]}
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Line Items
          </h3>
          <Button type="button" variant="secondary" onClick={addItem}>
            Add Item
          </Button>
        </div>

        <div className="space-y-4">
          {items.map((item, index) => (
            <div
              key={index}
              className="rounded-lg border border-gray-200 dark:border-gray-700 p-4"
            >
              <div className="space-y-4">
                <div className="space-y-4">
                  <Input
                    label="Description"
                    required
                    value={item.description}
                    onChange={(e) =>
                      updateItem(index, "description", e.target.value)
                    }
                    placeholder="e.g., January 2024 or Project milestone"
                  />
                  <Input
                    label="Additional Information"
                    value={item.additional_info || ""}
                    onChange={(e) =>
                      updateItem(index, "additional_info", e.target.value)
                    }
                    placeholder="Optional: dates, details, etc."
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                  <div className="md:col-span-4">
                    <Input
                      label="Price"
                      type="number"
                      step="0.01"
                      required
                      value={item.unit_price_ht}
                      onChange={(e) =>
                        updateItem(
                          index,
                          "unit_price_ht",
                          parseFloat(e.target.value) || 0
                        )
                      }
                    />
                  </div>
                  <div className="md:col-span-4">
                    <Input
                      label="Qty"
                      type="number"
                      step="0.01"
                      required
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(
                          index,
                          "quantity",
                          parseFloat(e.target.value) || 0
                        )
                      }
                    />
                  </div>
                  <div className="md:col-span-4 flex items-end">
                    <div className="w-full">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Total
                      </label>
                      <div className="rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-zinc-800 px-3 py-2 text-sm">
                        {item.total_ht.toFixed(2)} €
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {items.length > 1 && (
                <div className="mt-2">
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => removeItem(index)}
                  >
                    Remove
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="vat_applicable"
              checked={formData.vat_applicable}
              onChange={(e) =>
                setFormData({ ...formData, vat_applicable: e.target.checked })
              }
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label
              htmlFor="vat_applicable"
              className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              VAT Applicable
            </label>
          </div>
          {formData.vat_applicable && (
            <Input
              label="VAT Article"
              value={formData.vat_article || ""}
              onChange={(e) =>
                setFormData({ ...formData, vat_article: e.target.value })
              }
              placeholder="e.g., 293 B du Code Général des Impôts"
            />
          )}
        </div>

        <div className="space-y-2 rounded-lg bg-gray-50 dark:bg-zinc-800 p-4">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Total HT:</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {totalHT.toFixed(2)} €
            </span>
          </div>
          {formData.vat_applicable && (
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                TVA (20%):
              </span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {(totalTTC - totalHT).toFixed(2)} €
              </span>
            </div>
          )}
          <div className="flex justify-between border-t border-gray-300 dark:border-gray-600 pt-2">
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              Total TTC:
            </span>
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              {totalTTC.toFixed(2)} €
            </span>
          </div>
        </div>
      </div>

      <Input
        label="Notes"
        value={formData.notes || ""}
        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
      />

      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading
            ? "Saving..."
            : invoice
            ? "Update Invoice"
            : "Create Invoice"}
        </Button>
        {invoice && (
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push(`/invoices/${invoice.id}`)}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
