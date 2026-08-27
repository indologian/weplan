"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/shared/lib/supabase/browser-client";
import { GoogleOAuthButton } from "@/modules/auth/components/google-oauth-button";
import { getSafeAuthRedirect } from "@/modules/auth/redirect";

import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = getSafeAuthRedirect(searchParams.get("redirect"));
  const callbackError = searchParams.get("error") === "auth_callback_failed"
    ? "Login tidak dapat diselesaikan. Silakan coba lagi."
    : "";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError("");

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message === "Invalid login credentials"
          ? "Email atau password salah."
          : authError.message);
        return;
      }

      router.push(redirectTo);
      router.refresh();
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "0.5rem", textAlign: "center" }}>
        Masuk ke weplan
      </h1>
      <p style={{ color: "#6b7280", textAlign: "center", marginBottom: "1.5rem", fontSize: "0.875rem" }}>
        Belum punya akun?{" "}
        <Link href={`/register?redirect=${encodeURIComponent(redirectTo)}`} style={{ color: "#1a1a1a", fontWeight: 500 }}>
          Daftar
        </Link>
      </p>

      <GoogleOAuthButton redirectTo={redirectTo} />

      <div aria-hidden="true" style={{ display: "flex", alignItems: "center", gap: "0.75rem", margin: "1.25rem 0", color: "#9ca3af", fontSize: "0.75rem" }}>
        <span style={{ height: 1, flex: 1, background: "#e5e7eb" }} />
        ATAU DENGAN EMAIL
        <span style={{ height: 1, flex: 1, background: "#e5e7eb" }} />
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div>
          <label htmlFor="email" style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.25rem" }}>
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            style={{
              width: "100%",
              padding: "0.5rem 0.75rem",
              border: "1px solid #d1d5db",
              borderRadius: "0.5rem",
              fontSize: "0.875rem",
            }}
          />
        </div>

        <div>
          <label htmlFor="password" style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.25rem" }}>
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            style={{
              width: "100%",
              padding: "0.5rem 0.75rem",
              border: "1px solid #d1d5db",
              borderRadius: "0.5rem",
              fontSize: "0.875rem",
            }}
          />
        </div>

        {(error || callbackError) && (
          <p role="alert" style={{ color: "#dc2626", fontSize: "0.875rem" }}>{error || callbackError}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          style={{
            width: "100%",
            padding: "0.5rem 1rem",
            backgroundColor: "#1a1a1a",
            color: "#ffffff",
            border: "none",
            borderRadius: "0.5rem",
            fontSize: "0.875rem",
            fontWeight: 500,
            cursor: pending ? "not-allowed" : "pointer",
            opacity: pending ? 0.6 : 1,
          }}
        >
          {pending ? "Masuk..." : "Masuk"}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
