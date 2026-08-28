"use client";

import { useState } from "react";
import type { IssueSensitiveAuthAction } from "../types";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Button } from "@/shared/components/ui/button";

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
    <div className="space-y-4">
      <form onSubmit={submit} className="flex flex-col sm:flex-row items-end gap-3 max-w-sm">
        <div className="space-y-2 flex-1 w-full">
          <Label htmlFor="sensitive_password">Password Akun</Label>
          <Input
            id="sensitive_password"
            type="password"
            value={password}
            autoComplete="current-password"
            placeholder="Masukkan password..."
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
          {pending ? "Memverifikasi..." : "Verifikasi"}
        </Button>
      </form>
      {message && (
        <p className="text-sm font-medium text-destructive" aria-live="polite">{message}</p>
      )}
    </div>
  );
}
