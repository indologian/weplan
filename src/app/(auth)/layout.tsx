import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getOptionalUser } from "@/modules/auth/server/get-optional-user";

export const metadata: Metadata = {
  title: "Masuk - weplan",
  description: "Masuk ke akun weplan Anda",
};

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const user = await getOptionalUser();
  if (user) redirect("/dashboard");

  return (
    <div style={{ minHeight: "100svh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ width: "100%", maxWidth: "400px" }}>
        {children}
      </div>
    </div>
  );
}
