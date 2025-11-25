"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import { Table, TableRow, TableCell } from "@/components/ui/table";
import { formatDate } from "@/lib/utils/format";
import Modal from "@/components/ui/modal";

interface Client {
  id: string;
  reference: string;
  name: string;
  address?: string;
  created_at: string;
}

interface ClientListProps {
  clients: Client[];
}

export default function ClientList({
  clients: initialClients,
}: ClientListProps) {
  const router = useRouter();
  const supabase = createClient();
  const [clients, setClients] = useState(initialClients);
  const [search, setSearch] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [loading, setLoading] = useState(false);

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(search.toLowerCase()) ||
      client.reference.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async () => {
    if (!clientToDelete) return;

    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from("clients")
      .delete()
      .eq("id", clientToDelete.id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting client:", error);
      toast.error("Failed to delete client", {
        description: error.message,
      });
    } else {
      toast.success("Client deleted successfully");
      setClients(clients.filter((c) => c.id !== clientToDelete.id));
      setDeleteModalOpen(false);
      setClientToDelete(null);
      router.refresh();
    }

    setLoading(false);
  };

  return (
    <>
      <div className="mb-4">
        <Input
          placeholder="Search clients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filteredClients.length > 0 ? (
        <div className="rounded-lg bg-white dark:bg-zinc-900 shadow">
          <Table
            headers={["Reference", "Name", "Address", "Created", "Actions"]}
          >
            {filteredClients.map((client) => (
              <TableRow key={client.id}>
                <TableCell>{client.reference}</TableCell>
                <TableCell className="font-medium">{client.name}</TableCell>
                <TableCell>{client.address || "-"}</TableCell>
                <TableCell>{formatDate(client.created_at)}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/clients/${client.id}`)}
                    >
                      View
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        setClientToDelete(client);
                        setDeleteModalOpen(true);
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </Table>
        </div>
      ) : (
        <div className="rounded-lg bg-white dark:bg-zinc-900 p-12 text-center shadow">
          <p className="text-gray-500 dark:text-gray-400">
            {search
              ? "No clients match your search."
              : "No clients yet. Create your first client to get started."}
          </p>
        </div>
      )}

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setClientToDelete(null);
        }}
        title="Delete Client"
      >
        <p className="mb-4 text-gray-600 dark:text-gray-400">
          Are you sure you want to delete {clientToDelete?.name}? This will also
          delete all associated invoices. This action cannot be undone.
        </p>
        <div className="flex gap-2 justify-end">
          <Button
            variant="secondary"
            onClick={() => {
              setDeleteModalOpen(false);
              setClientToDelete(null);
            }}
          >
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={loading}>
            {loading ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </Modal>
    </>
  );
}
