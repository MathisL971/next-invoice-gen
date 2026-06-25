import { redirect } from "next/navigation";

export default async function BillingRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const params = new URLSearchParams({ tab: "abonnement" });
  if (status) params.set("status", status);
  redirect(`/settings?${params.toString()}`);
}
