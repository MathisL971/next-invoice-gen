"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import { SUPPORTED_CURRENCIES } from "@/lib/utils/format";

interface Profile {
  id: string;
  company_name?: string;
  address?: string;
  phone?: string;
  email?: string;
  default_currency?: string;
  banking_info?: {
    bank_name?: string;
    RIB?: string;
    IBAN?: string;
    BIC?: string;
  };
  legal_info?: {
    company_type?: string;
    siret?: string;
    siren?: string;
    rcs?: string;
    ape_naf?: string;
    tva_number?: string;
    service_type?: string;
    late_payment_notice?: string;
  };
}

interface ProfileFormData {
  company_name?: string;
  address?: string;
  phone?: string;
  email?: string;
  default_currency?: string;
  banking_info?: {
    bank_name?: string;
    RIB?: string;
    IBAN?: string;
    BIC?: string;
  };
  legal_info?: {
    company_type?: string;
    siret?: string;
    siren?: string;
    rcs?: string;
    ape_naf?: string;
    tva_number?: string;
    service_type?: string;
    late_payment_notice?: string;
  };
}

interface ProfileFormProps {
  profile: Profile;
}

export default function ProfileForm({ profile }: ProfileFormProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState<ProfileFormData>({
    company_name: profile.company_name || "",
    address: profile.address || "",
    phone: profile.phone || "",
    email: profile.email || "",
    default_currency: profile.default_currency || "EUR",
    banking_info: profile.banking_info || {
      bank_name: "",
      RIB: "",
      IBAN: "",
      BIC: "",
    },
    legal_info: profile.legal_info || {
      company_type: "",
      siret: "",
      siren: "",
      rcs: "",
      ape_naf: "",
      tva_number: "",
      service_type: "",
      late_payment_notice: "",
    },
  });

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

    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          company_name: formData.company_name || null,
          address: formData.address || null,
          phone: formData.phone || null,
          email: formData.email || null,
          default_currency: formData.default_currency || "EUR",
          banking_info: formData.banking_info,
          legal_info: formData.legal_info,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateError) throw updateError;

      toast.success("Profile updated successfully");
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      toast.error("Failed to update profile", {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      <Card title="Company Information">
        <div className="space-y-4">
          <Input
            label="Company Name"
            value={formData.company_name}
            onChange={(e) =>
              setFormData({ ...formData, company_name: e.target.value })
            }
          />

          <Input
            label="Address"
            value={formData.address}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
          />

          <Input
            label="Phone"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
          />

          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
          />

          <Select
            label="Default Currency"
            value={formData.default_currency || "EUR"}
            onChange={(e) =>
              setFormData({ ...formData, default_currency: e.target.value })
            }
            options={SUPPORTED_CURRENCIES.map((c) => ({
              value: c.code,
              label: c.name,
            }))}
          />
        </div>
      </Card>

      <Card title="Banking Information">
        <div className="space-y-4">
          <Input
            label="Bank Name"
            value={formData.banking_info?.bank_name || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                banking_info: {
                  ...formData.banking_info,
                  bank_name: e.target.value,
                },
              })
            }
          />

          <Input
            label="RIB"
            value={formData.banking_info?.RIB || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                banking_info: {
                  ...formData.banking_info,
                  RIB: e.target.value,
                },
              })
            }
          />

          <Input
            label="IBAN"
            value={formData.banking_info?.IBAN || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                banking_info: {
                  ...formData.banking_info,
                  IBAN: e.target.value,
                },
              })
            }
          />

          <Input
            label="BIC"
            value={formData.banking_info?.BIC || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                banking_info: {
                  ...formData.banking_info,
                  BIC: e.target.value,
                },
              })
            }
          />
        </div>
      </Card>

      <Card title="Legal Information">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          This information will appear at the bottom of your invoices.
        </p>
        <div className="space-y-4">
          <Input
            label="Company Type"
            placeholder="e.g., Micro-Entreprise, SARL, SAS"
            value={formData.legal_info?.company_type || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                legal_info: {
                  ...formData.legal_info,
                  company_type: e.target.value,
                },
              })
            }
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="SIRET"
              placeholder="e.g., 978 934 560 00019"
              value={formData.legal_info?.siret || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  legal_info: {
                    ...formData.legal_info,
                    siret: e.target.value,
                  },
                })
              }
            />

            <Input
              label="SIREN"
              placeholder="e.g., 978 934 560"
              value={formData.legal_info?.siren || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  legal_info: {
                    ...formData.legal_info,
                    siren: e.target.value,
                  },
                })
              }
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="RCS (City)"
              placeholder="e.g., Paris, Basse-Terre"
              value={formData.legal_info?.rcs || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  legal_info: {
                    ...formData.legal_info,
                    rcs: e.target.value,
                  },
                })
              }
            />

            <Input
              label="APE/NAF Code"
              placeholder="e.g., 6201Z"
              value={formData.legal_info?.ape_naf || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  legal_info: {
                    ...formData.legal_info,
                    ape_naf: e.target.value,
                  },
                })
              }
            />
          </div>

          <Input
            label="VAT Number (Num TVA)"
            placeholder="e.g., FR 70 978 934 560"
            value={formData.legal_info?.tva_number || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                legal_info: {
                  ...formData.legal_info,
                  tva_number: e.target.value,
                },
              })
            }
          />

          <Input
            label="Service Type"
            placeholder="e.g., Prestation de service"
            value={formData.legal_info?.service_type || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                legal_info: {
                  ...formData.legal_info,
                  service_type: e.target.value,
                },
              })
            }
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Late Payment Notice
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              rows={3}
              placeholder="e.g., En cas de retard de paiement, une indemnité forfaitaire pour frais de recouvrement de 40 euros sera exigée..."
              value={formData.legal_info?.late_payment_notice || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  legal_info: {
                    ...formData.legal_info,
                    late_payment_notice: e.target.value,
                  },
                })
              }
            />
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
