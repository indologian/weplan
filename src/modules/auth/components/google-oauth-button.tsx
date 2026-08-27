"use client";

import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { createSupabaseBrowserClient } from "@/shared/lib/supabase/browser-client";
import {
  createAuthCallbackUrl,
  getSafeAuthRedirect,
} from "@/modules/auth/redirect";

interface GoogleOAuthButtonProps {
  redirectTo: string;
}

export function GoogleOAuthButton({ redirectTo }: GoogleOAuthButtonProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleGoogleLogin() {
    setPending(true);
    setError("");

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: createAuthCallbackUrl(
            window.location.origin,
            getSafeAuthRedirect(redirectTo),
          ),
        },
      });

      if (authError) {
        setError("Login Google belum dapat dimulai. Silakan coba lagi.");
        setPending(false);
      }
    } catch {
      setError("Login Google belum dapat dimulai. Silakan coba lagi.");
      setPending(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: "0.5rem" }}>
      <Button
        type="button"
        variant="outline"
        disabled={pending}
        onClick={handleGoogleLogin}
        style={{ width: "100%" }}
      >
        <GoogleMark />
        {pending ? "Menghubungkan..." : "Lanjutkan dengan Google"}
      </Button>
      {error ? (
        <p aria-live="polite" style={{ color: "#dc2626", fontSize: "0.875rem" }}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

function GoogleMark() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="18"
      height="18"
      style={{ marginRight: "0.5rem" }}
    >
      <path fill="#4285f4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.41Z" />
      <path fill="#34a853" d="M12 22c2.7 0 4.98-.9 6.63-2.36l-3.24-2.54c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z" />
      <path fill="#fbbc05" d="M6.39 13.93A6.02 6.02 0 0 1 6.07 12c0-.67.12-1.32.32-1.93V7.45H3.04A10 10 0 0 0 2 12c0 1.64.39 3.2 1.04 4.55l3.35-2.62Z" />
      <path fill="#ea4335" d="M12 5.94c1.47 0 2.78.5 3.82 1.49l2.88-2.88A9.66 9.66 0 0 0 12 2a10 10 0 0 0-8.96 5.45l3.35 2.62C7.18 7.7 9.39 5.94 12 5.94Z" />
    </svg>
  );
}
