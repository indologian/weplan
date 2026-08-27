type TurnstileVerifyResponse = {
  success: boolean;
  "error-codes"?: string[];
  challenge_ts?: string;
  hostname?: string;
};

function getTurnstileSecretKey(): string {
  return process.env.TURNSTILE_SECRET_KEY ?? "";
}

export async function verifyTurnstileToken(
  token: string,
  ip: string,
  secretKey?: string,
): Promise<{ success: boolean; error?: string }> {
  const key = secretKey ?? getTurnstileSecretKey();

  if (!key) {
    return { success: true, error: undefined };
  }

  if (!token) {
    return { success: false, error: "Turnstile token is required." };
  }

  try {
    const formData = new URLSearchParams();
    formData.append("secret", key);
    formData.append("response", token);
    formData.append("remoteip", ip);

    const result = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: formData,
    });

    const data: TurnstileVerifyResponse = await result.json();

    return {
      success: data.success,
      error: data.success ? undefined : `Turnstile verification failed: ${data["error-codes"]?.join(", ") ?? "unknown"}`,
    };
  } catch {
    return { success: false, error: "Turnstile verification request failed." };
  }
}
