import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Masuk - weplan",
  description: "Masuk ke akun weplan Anda",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100svh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ width: "100%", maxWidth: "400px" }}>
        {children}
      </div>
    </div>
  );
}
