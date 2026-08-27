"use client";

import { useState, useEffect } from "react";
import Script from "next/script";

type Props = {
  invitationId: string;
  slug?: string;
};

declare global {
  interface Window {
    onTurnstileSuccess?: (token: string) => void;
  }
}

export function PinGate({ invitationId, slug }: Props) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");

  useEffect(() => {
    window.onTurnstileSuccess = (token: string) => {
      setTurnstileToken(token);
    };
    return () => {
      delete window.onTurnstileSuccess;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!turnstileToken) {
      setError("Silakan lengkapi verifikasi keamanan (CAPTCHA).");
      return;
    }

    setPending(true);
    setError("");

    try {
      const response = await fetch("/api/guest/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationId, pin, turnstileToken }),
      });

      const data = await response.json();

      if (data.success) {
        window.location.reload();
      } else {
        setError(data.error || "PIN salah.");
      }
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
      <div style={{ padding: "2rem", textAlign: "center", minHeight: "100svh", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Undangan Privat</h1>
        <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>
          Masukkan PIN untuk membuka undangan ini.
        </p>
        <form onSubmit={handleSubmit} style={{ maxWidth: "240px", margin: "0 auto" }}>
          <label style={{ display: "block", marginBottom: "1rem" }}>
            <input
              type="password"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "0.75rem",
                fontSize: "1.25rem",
                textAlign: "center",
                letterSpacing: "0.5rem",
                border: "1px solid #d1d5db",
                borderRadius: "0.5rem",
              }}
            />
          </label>
          <div style={{ marginBottom: "1rem", display: "flex", justifyContent: "center" }}>
            <div
              className="cf-turnstile"
              data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
              data-callback="onTurnstileSuccess"
            ></div>
          </div>
          <button
            type="submit"
            disabled={pending || !turnstileToken}
            style={{
              width: "100%",
              padding: "0.75rem",
              fontSize: "1rem",
              backgroundColor: "#1a1a1a",
              color: "#ffffff",
              border: "none",
              borderRadius: "0.5rem",
              cursor: pending || !turnstileToken ? "not-allowed" : "pointer",
              opacity: pending || !turnstileToken ? 0.6 : 1,
            }}
          >
            {pending ? "Memverifikasi..." : "Buka Undangan"}
          </button>
        </form>
        {error && (
          <p style={{ color: "#dc2626", marginTop: "1rem" }}>{error}</p>
        )}
      </div>
    </>
  );
}
