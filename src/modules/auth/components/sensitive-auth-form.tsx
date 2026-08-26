"use client";

import { useState } from "react";
import type { IssueSensitiveAuthAction } from "../types";

export function SensitiveAuthForm({
  issueSensitiveAuth,
  onAuthenticated,
}: {
  issueSensitiveAuth: IssueSensitiveAuthAction;
  onAuthenticated?: () => void;
}) {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setMessage("");
    const result = await issueSensitiveAuth({ password });
    setPending(false);
    if (!result.success) {
      setMessage(result.error);
      return;
    }
    setPassword("");
    onAuthenticated?.();
    setMessage(`Re-authentication berhasil sampai ${result.data.expiresAt}.`);
  };

  return (
    <section>
      <h2>Verifikasi tindakan sensitif</h2>
      <form onSubmit={submit}>
        <label>
          Password akun
          <input
            type="password"
            value={password}
            autoComplete="current-password"
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        <button type="submit" disabled={pending}>
          {pending ? "Memverifikasi..." : "Verifikasi"}
        </button>
      </form>
      <p aria-live="polite">{message}</p>
    </section>
  );
}
