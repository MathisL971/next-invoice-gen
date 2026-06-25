import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Connexion",
  description:
    "Facturation, déclaration de CA et cotisations CPS pour les micro-entrepreneurs de Saint-Barthélemy.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="h-dvh overflow-hidden">{children}</div>;
}
